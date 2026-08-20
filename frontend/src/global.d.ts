declare module "*.css";

// injected at build time by webpack DefinePlugin from the .env file
declare const process: {
  env: {
    NODE_ENV: string;
    PORT: string;
    API_BASE_URL: string;
  };
};
