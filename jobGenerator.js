// Job Generator - Creates random math problems from templates

class JobGenerator {
    constructor(jobTemplates) {
        this.templates = jobTemplates;
    }

    generateJob(jobType) {
        const template = this.templates[jobType];
        if (!template) return null;

        // Pick a random problem type
        const problemType = template.problemTypes[
            Math.floor(Math.random() * template.problemTypes.length)
        ];

        // Generate random values based on generator config
        const values = this.generateValues(problemType.generator);

        // Fill in the question template
        const question = this.fillTemplate(problemType.template, values);

        // Calculate the answer
        const answer = this.calculateAnswer(problemType.answerFormula, values);

        return {
            name: template.name,
            question: question,
            correctAnswer: Math.round(answer),
            reward: template.baseReward + Math.floor(Math.random() * 5), // 8-12 coins
            wrongAnswerDialog: template.wrongAnswerDialog,
            correctAnswerDialog: template.correctAnswerDialog,
            repeatable: template.repeatable
        };
    }

    generateValues(generator) {
        const values = {};

        for (const [key, config] of Object.entries(generator)) {
            if (typeof config === 'object' && config.min !== undefined) {
                // Simple range
                values[key] = Math.floor(Math.random() * (config.max - config.min + 1)) + config.min;
            } else if (typeof config === 'string') {
                // Formula like "people * (5 to 12)"
                values[key] = this.evaluateFormula(config, values);
            }
        }

        return values;
    }

    evaluateFormula(formula, existingValues) {
        // Handle formulas like "people * (5 to 12)"
        const rangeMatch = formula.match(/(\w+)\s*\*\s*\((\d+)\s+to\s+(\d+)\)/);
        if (rangeMatch) {
            const varName = rangeMatch[1];
            const min = parseInt(rangeMatch[2]);
            const max = parseInt(rangeMatch[3]);
            const multiplier = Math.floor(Math.random() * (max - min + 1)) + min;
            return existingValues[varName] * multiplier;
        }

        return 0;
    }

    fillTemplate(template, values) {
        let result = template;
        for (const [key, value] of Object.entries(values)) {
            result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
        }
        return result;
    }

    calculateAnswer(formula, values) {
        // Replace variable names with their values
        let expression = formula;
        for (const [key, value] of Object.entries(values)) {
            expression = expression.replace(new RegExp(key, 'g'), value);
        }

        // Safely evaluate the expression
        try {
            return Function('"use strict"; return (' + expression + ')')();
        } catch (e) {
            console.error('Error calculating answer:', e);
            return 0;
        }
    }
}
