'use client';

import { useEffect } from 'react';

const SWAGGER_UI_VERSION = '5.27.1';
const CSS_ID = 'swagger-ui-css';
const SCRIPT_ID = 'swagger-ui-bundle';

type SwaggerUIBundleFn = (options: {
  url: string;
  dom_id: string;
  persistAuthorization?: boolean;
  deepLinking?: boolean;
  displayRequestDuration?: boolean;
}) => void;

function getSwaggerUIBundle(): SwaggerUIBundleFn | undefined {
  return (window as Window & { SwaggerUIBundle?: SwaggerUIBundleFn }).SwaggerUIBundle;
}

function mountSwagger() {
  const SwaggerUIBundle = getSwaggerUIBundle();
  if (!SwaggerUIBundle) return;
  SwaggerUIBundle({
    url: '/api/docs',
    dom_id: '#swagger-ui',
    persistAuthorization: true,
    deepLinking: true,
    displayRequestDuration: true,
  });
}

export function SwaggerUI() {
  useEffect(() => {
    if (!document.getElementById(CSS_ID)) {
      const link = document.createElement('link');
      link.id = CSS_ID;
      link.rel = 'stylesheet';
      link.href = `https://unpkg.com/swagger-ui-dist@${SWAGGER_UI_VERSION}/swagger-ui.css`;
      document.head.appendChild(link);
    }

    if (getSwaggerUIBundle()) {
      mountSwagger();
      return;
    }

    const existing = document.getElementById(SCRIPT_ID);
    if (existing) {
      existing.addEventListener('load', mountSwagger);
      return () => existing.removeEventListener('load', mountSwagger);
    }

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = `https://unpkg.com/swagger-ui-dist@${SWAGGER_UI_VERSION}/swagger-ui-bundle.js`;
    script.onload = mountSwagger;
    document.body.appendChild(script);
  }, []);

  return <div id="swagger-ui" />;
}
