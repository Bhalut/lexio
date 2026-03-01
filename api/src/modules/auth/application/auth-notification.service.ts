import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';

@Injectable()
export class AuthNotificationService {
  private readonly logger = new Logger(AuthNotificationService.name);

  constructor(private readonly config: ConfigService) {}

  async sendPasswordResetEmail(input: {
    to: string;
    fullName: string;
    resetUrl: string;
    expiresAt: Date;
  }): Promise<void> {
    const payload = {
      to: input.to,
      subject: 'Restablece tu acceso a Lexio',
      text: [
        `Hola ${input.fullName},`,
        '',
        'Recibimos una solicitud para restablecer tu acceso a Lexio.',
        `Usa este enlace antes de ${input.expiresAt.toISOString()}:`,
        input.resetUrl,
        '',
        'Si no solicitaste este cambio, puedes ignorar este mensaje.',
      ].join('\n'),
      html: `
        <p>Hola ${escapeHtml(input.fullName)},</p>
        <p>Recibimos una solicitud para restablecer tu acceso a Lexio.</p>
        <p>
          <a href="${escapeHtml(input.resetUrl)}">Restablecer contraseña</a>
        </p>
        <p>El enlace expira el ${escapeHtml(input.expiresAt.toISOString())}.</p>
        <p>Si no solicitaste este cambio, puedes ignorar este mensaje.</p>
      `.trim(),
      expiresAt: input.expiresAt.toISOString(),
      resetUrl: input.resetUrl,
    };

    const mode = (this.config.get<string>('auth.emailDeliveryMode') || 'file').toLowerCase();
    if (mode === 'log') {
      this.logger.log(`Password reset email for ${input.to}: ${input.resetUrl}`);
      return;
    }

    if (mode === 'file') {
      const outboxPath =
        this.config.get<string>('auth.emailOutboxPath') || './var/mail-outbox';
      await mkdir(outboxPath, { recursive: true });
      const fileName = `${Date.now()}-${sanitizeFilePart(input.to)}.json`;
      await writeFile(
        join(outboxPath, fileName),
        JSON.stringify(payload, null, 2),
        'utf8',
      );
      this.logger.log(`Password reset email queued at ${fileName}`);
      return;
    }

    if (mode === 'resend') {
      await this.postEmailRequest(
        this.getRequiredConfig('auth.emailApiUrl', 'https://api.resend.com/emails'),
        {
          Authorization: `Bearer ${this.getRequiredConfig('auth.emailApiKey')}`,
          'Content-Type': 'application/json',
        },
        {
          from: this.getRequiredConfig('auth.emailFrom'),
          to: [input.to],
          subject: payload.subject,
          html: payload.html,
          text: payload.text,
          reply_to: this.config.get<string>('auth.emailReplyTo') || undefined,
        },
      );
      return;
    }

    if (mode === 'postmark') {
      await this.postEmailRequest(
        this.getRequiredConfig(
          'auth.emailApiUrl',
          'https://api.postmarkapp.com/email',
        ),
        {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-Postmark-Server-Token': this.getRequiredConfig('auth.emailApiKey'),
        },
        {
          From: this.getRequiredConfig('auth.emailFrom'),
          To: input.to,
          Subject: payload.subject,
          HtmlBody: payload.html,
          TextBody: payload.text,
          ReplyTo: this.config.get<string>('auth.emailReplyTo') || undefined,
          MessageStream: 'outbound',
        },
      );
      return;
    }

    if (mode === 'sendgrid') {
      await this.postEmailRequest(
        this.getRequiredConfig(
          'auth.emailApiUrl',
          'https://api.sendgrid.com/v3/mail/send',
        ),
        {
          Authorization: `Bearer ${this.getRequiredConfig('auth.emailApiKey')}`,
          'Content-Type': 'application/json',
        },
        {
          personalizations: [
            {
              to: [{ email: input.to }],
            },
          ],
          from: { email: this.getRequiredConfig('auth.emailFrom') },
          reply_to: this.config.get<string>('auth.emailReplyTo')
            ? { email: this.config.get<string>('auth.emailReplyTo') as string }
            : undefined,
          subject: payload.subject,
          content: [
            { type: 'text/plain', value: payload.text },
            { type: 'text/html', value: payload.html },
          ],
        },
      );
      return;
    }

    if (mode === 'webhook') {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      const secret = this.config.get<string>('auth.emailWebhookSecret');
      if (secret) {
        headers['Authorization'] = `Bearer ${secret}`;
      }
      await this.postEmailRequest(
        this.getRequiredConfig('auth.emailWebhookUrl'),
        headers,
        payload,
      );
      return;
    }

    throw new ServiceUnavailableException(
      `Unsupported email delivery mode: ${mode}`,
    );
  }

  private getRequiredConfig(key: string, fallback?: string): string {
    const value = this.config.get<string>(key) || fallback;
    if (!value) {
      throw new ServiceUnavailableException(
        `Email delivery is not configured correctly (${key}).`,
      );
    }

    return value;
  }

  private async postEmailRequest(
    url: string,
    headers: Record<string, string>,
    body: Record<string, unknown>,
  ): Promise<void> {
    const timeoutMs = Number(this.config.get<number>('auth.emailTimeoutMs') || 8000);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        const responseText = await response.text();
        this.logger.error(
          `Email provider request failed (${response.status}): ${responseText}`,
        );
        throw new ServiceUnavailableException(
          'Email delivery provider rejected the message.',
        );
      }
    } catch (error) {
      if (error instanceof ServiceUnavailableException) {
        throw error;
      }

      this.logger.error('Email delivery request failed.', error as Error);
      throw new ServiceUnavailableException(
        'Unable to reach the configured email delivery provider.',
      );
    } finally {
      clearTimeout(timeout);
    }
  }
}

function sanitizeFilePart(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]/g, '_');
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
