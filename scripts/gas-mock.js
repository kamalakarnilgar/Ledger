/**
 * Local development shim for Google Apps Script (google.script.run).
 * Injected by scripts/local-dev-server.py — not used in production deployments.
 */
(function () {
  'use strict';

  const DEV_STATE_KEY = 'ledger_dev_cloud_state_v1';
  const DEV_USERS = [
    {
      email: 'admin@ledger.local',
      password: 'Admin123!',
      role: 'admin',
      mustReset: false,
    },
    {
      email: 'user@ledger.local',
      password: 'User123!',
      role: 'user',
      mustReset: false,
    },
  ];

  function readCloudState() {
    try {
      const raw = localStorage.getItem(DEV_STATE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function writeCloudState(payload) {
    localStorage.setItem(DEV_STATE_KEY, JSON.stringify(payload || null));
  }

  function sessionForToken(token) {
    if (!token || !token.startsWith('dev-token:')) return null;
    const email = token.slice('dev-token:'.length);
    const user = DEV_USERS.find((u) => u.email === email);
    if (!user) return null;
    return {
      email: user.email,
      role: user.role,
      mustReset: false,
      token,
    };
  }

  function fail(message) {
    const err = new Error(message || 'Request failed');
    err.name = 'ScriptError';
    throw err;
  }

  const handlers = {
    authLogin(email, password) {
      const user = DEV_USERS.find(
        (u) => u.email === String(email || '').trim().toLowerCase() && u.password === password
      );
      if (!user) fail('Invalid email or password.');
      const token = 'dev-token:' + user.email;
      return {
        token,
        email: user.email,
        role: user.role,
        mustReset: user.mustReset,
      };
    },

    authRefresh(token) {
      const session = sessionForToken(token);
      if (!session) fail('Session expired. Please sign in again.');
      return session;
    },

    authLogout() {
      return { ok: true };
    },

    authForgotPassword(email) {
      return {
        message:
          'Local dev mode: password reset requests are not sent. Use admin@ledger.local / Admin123! or user@ledger.local / User123!.',
      };
    },

    authChangePassword(token, current, next) {
      const session = sessionForToken(token);
      if (!session) fail('Session expired. Please sign in again.');
      const user = DEV_USERS.find((u) => u.email === session.email);
      if (!user || user.password !== current) fail('Current password is incorrect.');
      user.password = next;
      user.mustReset = false;
      return { token };
    },

    saveState(payload) {
      const session = sessionForToken(payload && payload.token);
      if (!session) fail('Session expired. Please sign in again.');
      writeCloudState({
        updatedAt: payload.updatedAt || Date.now(),
        data: payload.data || null,
        owner: session.email,
      });
      return { ok: true };
    },

    loadState(token) {
      const session = sessionForToken(token);
      if (!session) fail('Session expired. Please sign in again.');
      return readCloudState();
    },

    authAdminListPendingRequests() {
      return [];
    },

    authAdminListUsers(token) {
      const session = sessionForToken(token);
      if (!session || session.role !== 'admin') fail('Admin access required.');
      return DEV_USERS.map((u) => ({
        email: u.email,
        role: u.role,
        account_status: 'active',
        is_temporary_password: false,
        is_first_login: false,
        failed_attempts: 0,
        locked_until: null,
      }));
    },

    authAdminListAuditLogs() {
      return [
        {
          created_at: new Date().toISOString(),
          event: 'LOCAL_DEV_BOOT',
          email: 'admin@ledger.local',
          detail: 'Running with local Google Apps Script mock',
        },
      ];
    },

    authAdminApproveRequest() {
      return { message: 'Approved (local dev mock).' };
    },

    authAdminRejectRequest() {
      return { message: 'Rejected (local dev mock).' };
    },
  };

  function createRunner() {
    const runner = {
      _success(fn) {
        return fn;
      },
      _failure(fn) {
        return fn;
      },
      withSuccessHandler(fn) {
        this._success = fn;
        return this;
      },
      withFailureHandler(fn) {
        this._failure = fn;
        return this;
      },
    };

    return new Proxy(runner, {
      get(target, prop) {
        if (prop in target) return target[prop];
        if (typeof prop !== 'string' || !(prop in handlers)) {
          return undefined;
        }
        return (...args) => {
          window.setTimeout(() => {
            try {
              const result = handlers[prop](...args);
              target._success(result);
            } catch (err) {
              target._failure(err);
            }
          }, 0);
          return target;
        };
      },
    });
  }

  window.google = window.google || {};
  window.google.script = { run: createRunner() };

  const banner = document.createElement('div');
  banner.textContent = 'Local dev mode — GAS backend mocked. Login: admin@ledger.local / Admin123!';
  banner.style.cssText =
    'position:fixed;bottom:0;left:0;right:0;z-index:99998;background:#1B1A33;color:#2FE0D6;font:12px/1.4 Inter,system-ui,sans-serif;padding:6px 12px;text-align:center;pointer-events:none;';
  document.addEventListener('DOMContentLoaded', () => document.body.appendChild(banner));
})();
