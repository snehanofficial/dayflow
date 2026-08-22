interface Config {
  apiUrl: string;
  isDev: boolean;
}

const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = import.meta.env[key];
  if (value === undefined || value === '') {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(
      `❌ Required client environment variable ${key} was not provided.`,
    );
  }
  return value;
};

export const config: Config = {
  apiUrl: getEnvVar('VITE_API_URL', 'http://localhost:4000'),
  isDev: import.meta.env.DEV,
};
export type { Config };
