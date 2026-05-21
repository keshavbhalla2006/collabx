const { generateQuestion } = require('../services/ai.service'); //import the ai service function

const getQuestion = async (req, res) => {
    try {
        const { topic, difficulty, language } = req.body; //get input from frontend
        if (!topic || !difficulty) {
            return res.status(400).json({
                message: 'Topic and difficulty are required'
            });
        }
        console.log(`Generating question - topic: ${topic}, difficulty: ${difficulty}`);
        const question = await generateQuestion({ topic, difficulty, language }); //calls previously defined function, waits(await) for AI to return a structured question object
        res.json({ question }); //sends JSON response to the frontend
    } catch (err) {
        console.error('AI question error: ', err.message);

        if (err instanceof SyntaxError) { //special case: JSON PARSING ERROR: This specifically catches-----> JSON.parse() failure from the service. That is AI returned invalid JSON
            return res.status(500).json({
                message: 'AI returned an invalid response: Please try again',
            });
        }

        res.status(500).json({
            message: err.message || 'Failed to generate question',
        });
    }
};

module.exports = { getQuestion };

//This code is controller layer: it connects the frontend request to the AI service (generateQuestion) and sends the result back to the client.