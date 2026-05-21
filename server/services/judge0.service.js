const axios = require('axios');
require('dotenv').config();

// Maps our language names to Piston's exact runtime names and versions
// These must match exactly what Piston has installed
const PISTON_LANGUAGES = {
  javascript: { language: 'javascript', version: '18.15.0' },
  python:     { language: 'python',     version: '3.10.0'  },
  typescript: { language: 'typescript', version: '5.0.3'   },
  java:       { language: 'java',       version: '15.0.2'  },
  c:          { language: 'c',          version: '10.2.0'  },
  cpp:        { language: 'c++',        version: '10.2.0'  },
  go:         { language: 'go',         version: '1.16.2'  },
  rust:       { language: 'rust',       version: '1.50.0'  },
  csharp:     { language: 'csharp',     version: '6.12.0'  },
  ruby:       { language: 'ruby',       version: '3.0.1'   },
  php:        { language: 'php',        version: '8.2.3'   },
  swift:      { language: 'swift',      version: '5.3.3'   },
  kotlin:     { language: 'kotlin',     version: '1.8.20'  },
  bash:       { language: 'bash',       version: '5.2.0'   },
};

const executeCode = async ({ language, code, stdin = '' }) => {
  const lang = PISTON_LANGUAGES[language];

  if (!lang) {
    throw new Error(`Unsupported language: ${language}`);
  }

  console.log(`Executing ${language} via Piston at ${process.env.PISTON_URL}`);

  const res = await axios.post(
    `${process.env.PISTON_URL}/api/v2/execute`,
    {
      language: lang.language,
      version:  lang.version,
      files:    [{ name: 'main', content: code }],
      stdin,
    },
    {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000,
    }
  );

  const run     = res.data.run;
  const compile = res.data.compile;

  const stdout         = run?.stdout         || '';
  const stderr         = run?.stderr         || '';
  const compile_output = compile?.stderr     || compile?.output || '';
  const isError        = !!(stderr || compile_output);

  console.log(`Execution done — status: ${isError ? 'Error' : 'Accepted'}`);

  return {
    stdout,
    stderr,
    compile_output,
    status:   isError ? 'Runtime Error' : 'Accepted',
    statusId: isError ? 11 : 3,
    time:     run?.time   || null,
    memory:   run?.memory || null,
  };
};

module.exports = { executeCode };