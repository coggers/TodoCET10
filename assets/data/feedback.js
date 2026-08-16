/**
 * Where the feedback form sends to.
 *
 * The form posts to Web3Forms, which is free, needs no backend of our own, and
 * is designed for static sites — the access key is a public identifier, safe to
 * commit and to expose in client-side code. It cannot be used to read anything.
 *
 * To switch it on:
 *   1. Go to https://web3forms.com, enter the address you want feedback sent to.
 *   2. They email you an access key. Paste it below and redeploy.
 *
 * Until a key is set the form hides itself and the feedback dialog offers
 * GitHub Issues instead, so there is never a form that silently fails.
 */
export const ACCESS_KEY = '';

export const ENDPOINT = 'https://api.web3forms.com/submit';

export const REPO_URL = 'https://github.com/coggers/TodoCET10';
export const ISSUES_URL = `${REPO_URL}/issues/new`;

export const hasForm = () => ACCESS_KEY.length > 0;
