const express = require('express');
const router = express.Router(); //express.Router() → creates a modular route handler, Helps keep your routes organized instead of putting everything in server.js
const { protect } = require('../middleware/auth.middleware'); //The middleware-> ensures the user is authenticated
const {runCode} = require('../controllers/execution.controller'); //The controller -> this validates input, calls Judg0, returns execution result

router.post('/',protect, runCode);
/*
When a POST request is made to this route:

protect runs first
checks if user is logged in
if not → request is blocked
If authenticated → runCode executes
*/

module.exports = router;
//a simple Express route file that wires the API endpoint to the controller that was just built, with authentication in between.