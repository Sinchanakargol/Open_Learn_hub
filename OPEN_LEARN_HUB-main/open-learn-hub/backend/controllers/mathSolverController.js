import * as mathjs from 'mathjs';

const mathSolverController = {
    /**
     * Solve the equation and provide step-by-step solution
     */
    solveEquation: async (req, res) => {
        try {
            const { equation } = req.body;
            
            if (!equation) {
                return res.status(400).json({
                    success: false,
                    message: 'Equation is required'
                });
            }

            // Parse and solve the equation
            const result = mathjs.evaluate(equation);
            
            // Generate steps (this is a simplified version)
            const steps = [
                {
                    step: 1,
                    description: 'Original equation',
                    equation: equation
                },
                {
                    step: 2,
                    description: 'Solution',
                    equation: `${equation} = ${result}`
                }
            ];

            return res.json({
                success: true,
                result,
                steps
            });
        } catch (error) {
            console.error('Error solving equation:', error);
            return res.status(500).json({
                success: false,
                message: 'Error solving equation',
                error: error.message
            });
        }
    },

    /**
     * Get information about the current model
     */
    getModelInfo: async (req, res) => {
        try {
            // This would typically come from your model metadata
            const modelInfo = {
                name: 'Math CNN Model',
                version: '1.0',
                supportedSymbols: [
                    '0-9',
                    '+',
                    '-',
                    '×',
                    '÷',
                    '(',
                    ')',
                    '=',
                    '.',
                ],
                accuracy: '95%',
                lastUpdated: new Date().toISOString()
            };

            return res.json({
                success: true,
                modelInfo
            });
        } catch (error) {
            console.error('Error getting model info:', error);
            return res.status(500).json({
                success: false,
                message: 'Error retrieving model information',
                error: error.message
            });
        }
    }
};

export { mathSolverController };