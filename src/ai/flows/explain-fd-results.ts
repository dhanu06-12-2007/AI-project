'use server';

/**
 * @fileOverview This file defines a Genkit flow for explaining FD results in plain language.
 *
 * It takes FD parameters as input and uses an AI model to generate human-readable insights about the factors
 * influencing the maturity amount and interest earned.
 *
 * @exports explainFDResults - The main function to trigger the explanation flow.
 * @exports ExplainFDResultsInput - The input type for the explainFDResults function.
 * @exports ExplainFDResultsOutput - The output type for the explainFDResults function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExplainFDResultsInputSchema = z.object({
  principal: z.number().describe('The principal FD amount.'),
  tenure: z.number().describe('The tenure of the deposit in years.'),
  interestRate: z.number().describe('The annual interest rate.'),
  compoundingFrequency: z
    .enum(['Annually', 'Semi-annually', 'Quarterly', 'Monthly'])
    .describe('The compounding frequency.'),
  maturityAmount: z.number().describe('The calculated maturity amount.'),
  totalInterest: z.number().describe('The calculated total interest earned.'),
});

export type ExplainFDResultsInput = z.infer<typeof ExplainFDResultsInputSchema>;

const ExplainFDResultsOutputSchema = z.object({
  explanation: z.string().describe('A plain language explanation of the FD results.'),
});

export type ExplainFDResultsOutput = z.infer<typeof ExplainFDResultsOutputSchema>;

export async function explainFDResults(input: ExplainFDResultsInput): Promise<ExplainFDResultsOutput> {
  return explainFDResultsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'explainFDResultsPrompt',
  input: {schema: ExplainFDResultsInputSchema},
  output: {schema: ExplainFDResultsOutputSchema},
  prompt: `You are an expert financial advisor explaining Fixed Deposit (FD) results to a user in plain language.

  Given the following FD details, provide a concise and easy-to-understand explanation of the key factors influencing the maturity amount and interest earned. Focus on helping the user understand the impact of each factor (principal, tenure, interest rate, compounding frequency) on the final outcome. Allow the user to run 'what if' scenarios by providing them a plain-language interpretation of their calculated results.

  Principal Amount: {{{principal}}}
  Tenure (Years): {{{tenure}}}
  Interest Rate: {{{interestRate}}}
  Compounding Frequency: {{{compoundingFrequency}}}
  Maturity Amount: {{{maturityAmount}}}
  Total Interest Earned: {{{totalInterest}}}

  Explanation:`,
});

const explainFDResultsFlow = ai.defineFlow(
  {
    name: 'explainFDResultsFlow',
    inputSchema: ExplainFDResultsInputSchema,
    outputSchema: ExplainFDResultsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
