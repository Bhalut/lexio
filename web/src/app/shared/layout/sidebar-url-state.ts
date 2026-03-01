export interface SidebarAuthQueryState {
  cleanedParams: URLSearchParams;
  loginError: string;
  resetEmail: string;
  resetToken: string;
  showResetModal: boolean;
}

export function parseSidebarAuthQueryState(
  search: string,
  fallbackEmail: string,
): SidebarAuthQueryState {
  const params = new URLSearchParams(search);
  let loginError = '';
  let resetEmail = fallbackEmail;
  let resetToken = '';
  let showResetModal = false;

  if (params.get('authError') === 'sso') {
    loginError =
      'No fue posible completar el ingreso con el proveedor de identidad.';
    params.delete('authError');
  }

  const requestedResetToken = params.get('resetToken');
  if (requestedResetToken) {
    resetToken = requestedResetToken;
    resetEmail = params.get('email') || fallbackEmail;
    showResetModal = true;
  }

  return {
    cleanedParams: params,
    loginError,
    resetEmail,
    resetToken,
    showResetModal,
  };
}

export function buildSidebarUrl(
  pathname: string,
  params: URLSearchParams,
  hash: string,
): string {
  const query = params.toString();
  return `${pathname}${query ? `?${query}` : ''}${hash}`;
}
