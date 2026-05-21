const { executeCode } = require('../services/judge0.service'); 
//Imports the function you created earlier
//This function actually talks to Judge0 and executes code

const runCode = async (req, res) => { //This is an Express route handler
  try {
    const { code, language, stdin, roomId } = req.body;
    //code → user’s code, language → programming language, stdin → optional input, roomId → (for your collaboration feature)

    if (!code || !language) {
      return res.status(400).json({ message: 'Code and language are required.' });
    }
    if (!code.trim()) {
      return res.status(400).json({ message: 'Cannot execute empty code.' });
    }

    console.log(`Executing ${language} for user ${req.user.name}...`);

    const result = await executeCode({ language, code, stdin }); //calls Judge0 service, returns: stdout, stderr, compile_output, status, time, memory

    // Decide what to show — compile error takes priority over stderr over stdout
    const output  = result.compile_output || result.stderr || result.stdout || '(no output)';
    const isError = !!(result.compile_output || result.stderr); //converts to boolean(true/false), if any error exists -> true
/*
Priority logic:

Compile error (most important)
Runtime error (stderr)
Normal output (stdout)
fallback → (no output)
*/

    res.json({
      output,
      stdout:         result.stdout,
      stderr:         result.stderr,
      compile_output: result.compile_output,
      status:         result.status,
      statusId:       result.statusId,
      time:           result.time,
      memory:         result.memory,
      isError,
      language,
      executedBy:     req.user.name,
      roomId,
    });

  } catch (err) {
    console.error('Execution error:', err.message);
    res.status(500).json({
      message: err.message || 'Execution failed.',
      isError: true,
    });
  }
};

module.exports = { runCode };

//This is your controller function that connects your frontend (user requests) with the Judge0 execution service you wrote earlier. It validates input, runs the code, and formats the response nicely.
/*
This shows:

clean separation of concerns
controller → handles request/response
service → handles external API
proper error handling
good UX logic (output priority)
scalable for real-time collaboration (roomId)
*/