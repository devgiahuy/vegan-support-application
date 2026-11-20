import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { LoginForm } from './login-form';

let mockIsPending = false;

vi.mock('../queries/auth.queries', () => ({
  useLoginMutation: () => ({
    mutateAsync: vi.fn(),
    isPending: mockIsPending,
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe('LoginForm loading spinner and forgot password behavior', () => {
  beforeEach(() => {
    mockIsPending = false;
  });

  it('renders default submit button with "Đăng nhập" and no spinner when not loading', () => {
    mockIsPending = false;
    const html = renderToStaticMarkup(createElement(LoginForm));

    expect(html).toContain('Đăng nhập');
    expect(html).not.toContain('animate-spin');
    expect(html).not.toContain('Đang xác thực...');
    expect(html).toContain('type="submit"');
  });

  it('renders loading spinner and "Đang xác thực..." when login is pending', () => {
    mockIsPending = true;
    const html = renderToStaticMarkup(createElement(LoginForm));

    expect(html).toContain('animate-spin');
    expect(html).toContain('Đang xác thực...');
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('disabled=""');
  });

  it('disables email and password inputs during loading to prevent re-submission', () => {
    mockIsPending = true;
    const html = renderToStaticMarkup(createElement(LoginForm));

    expect(html).toMatch(/id="login-email"[^>]*disabled=""/);
    expect(html).toMatch(/id="login-password"[^>]*disabled=""/);
  });

  it('hides "Quên mật khẩu?" button when onForgotPassword is not provided', () => {
    const html = renderToStaticMarkup(createElement(LoginForm));
    expect(html).not.toContain('Quên mật khẩu?');
  });

  it('renders "Quên mật khẩu?" button when onForgotPassword is provided', () => {
    const html = renderToStaticMarkup(createElement(LoginForm, { onForgotPassword: vi.fn() }));
    expect(html).toContain('Quên mật khẩu?');
  });
});
