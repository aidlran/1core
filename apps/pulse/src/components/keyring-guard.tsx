import { useNavigate } from '@solidjs/router';
import { createEffect, JSX, Show } from 'solid-js';
import { keyringUnlocked } from '../lib/astrobase';

export interface KeyringGuardProps {
  children: JSX.Element;
  redirectPath: string;
  unlockStatus: boolean;
}

export function KeyringGuard(props: KeyringGuardProps): JSX.Element {
  const navigate = useNavigate();

  createEffect(() => {
    if (keyringUnlocked() != props.unlockStatus) {
      navigate(props.redirectPath, { replace: true });
    }
  });

  return <Show when={keyringUnlocked() == props.unlockStatus}>{props.children}</Show>;
}
