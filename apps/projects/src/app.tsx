import { MetaProvider, Title } from '@solidjs/meta';
import { Router } from '@solidjs/router';
import { FileRoutes } from '@solidjs/start/router';
import { Suspense } from 'solid-js';

import './app.css';

export default () => (
  <Router
    root={(props) => (
      <MetaProvider>
        <Title>1core Pulse</Title>
        <Suspense>{props.children}</Suspense>
      </MetaProvider>
    )}
  >
    <FileRoutes />
  </Router>
);
