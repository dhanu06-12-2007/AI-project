"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Banknote,
  Calendar,
  Percent,
  RefreshCw,
  Loader2,
  Sparkles,
  ArrowRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { explainFDResults } from "@/ai/flows/explain-fd-results";

const formSchema = z.object({
  principal: z.coerce
    .number({ invalid_type_error: "Please enter a valid number." })
    .min(1, "Principal must be at least 1."),
  tenure: z.coerce
    .number({ invalid_type_error: "Please enter a valid number." })
    .min(1, "Tenure must be at least 1 year."),
  interestRate: z.coerce
    .number({ invalid_type_error: "Please enter a valid number." })
    .min(0.1, "Interest rate must be at least 0.1%.")
    .max(100, "Interest rate cannot exceed 100%."),
  compoundingFrequency: z.enum([
    "Annually",
    "Semi-annually",
    "Quarterly",
    "Monthly",
  ]),
});

type FormValues = z.infer<typeof formSchema>;

type Results = {
  maturityAmount: number;
  totalInterest: number;
};

export default function FdCalculator() {
  const [results, setResults] = useState<Results | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      principal: 100000,
      tenure: 5,
      interestRate: 6.5,
      compoundingFrequency: "Annually",
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    setResults(null);
    setExplanation(null);

    const { principal, tenure, interestRate, compoundingFrequency } = data;
    const rate = interestRate / 100;
    const n =
      {
        Annually: 1,
        "Semi-annually": 2,
        Quarterly: 4,
        Monthly: 12,
      }[compoundingFrequency] || 1;

    const maturityAmount = principal * Math.pow(1 + rate / n, n * tenure);
    const totalInterest = maturityAmount - principal;

    setResults({ maturityAmount, totalInterest });

    try {
      const aiResponse = await explainFDResults({
        principal,
        tenure,
        interestRate,
        compoundingFrequency,
        maturityAmount,
        totalInterest,
      });
      setExplanation(aiResponse.explanation);
    } catch (error) {
      console.error("AI explanation failed:", error);
      setExplanation("Could not generate an explanation at this time. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <Card className="w-full max-w-2xl shadow-2xl">
      <CardHeader>
        <CardTitle className="font-headline text-3xl text-primary">
          FD Clarity
        </CardTitle>
        <CardDescription>
          Calculate your Fixed Deposit returns and get AI-powered insights.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="principal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Principal Amount</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input type="number" placeholder="e.g., 100000" className="pl-10" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tenure"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tenure (in years)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input type="number" placeholder="e.g., 5" className="pl-10" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="interestRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Interest Rate (%)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input type="number" step="0.01" placeholder="e.g., 6.5" className="pl-10" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="compoundingFrequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Compounding Frequency</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <div className="relative">
                           <RefreshCw className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                           <SelectTrigger className="pl-10">
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                        </div>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Annually">Annually</SelectItem>
                        <SelectItem value="Semi-annually">Semi-annually</SelectItem>
                        <SelectItem value="Quarterly">Quarterly</SelectItem>
                        <SelectItem value="Monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="mr-2 h-4 w-4" />
              )}
              Calculate & Explain
            </Button>
          </form>
        </Form>
      </CardContent>

      {(isLoading || results || explanation) && (
        <CardFooter className="flex-col items-start gap-4">
          <Separator />
          
          <div className="w-full space-y-6 pt-4 animate-in fade-in-0 duration-500">
            {results && !isLoading && (
              <div className="space-y-4">
                <h3 className="text-xl font-headline font-semibold text-primary">Your Results</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-lg bg-accent/50 p-4">
                    <p className="text-sm text-muted-foreground">Maturity Amount</p>
                    <p className="text-2xl font-bold text-primary">{formatCurrency(results.maturityAmount)}</p>
                  </div>
                  <div className="rounded-lg bg-accent/50 p-4">
                    <p className="text-sm text-muted-foreground">Total Interest Earned</p>
                    <p className="text-2xl font-bold text-primary">{formatCurrency(results.totalInterest)}</p>
                  </div>
                </div>
              </div>
            )}
            
            {(isLoading || explanation) && (
              <div className="space-y-4">
                <h3 className="text-xl font-headline font-semibold text-primary flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-accent-foreground" />
                  AI-Powered Explanation
                </h3>
                {isLoading && !explanation ? (
                  <div className="space-y-2 pt-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-[80%]" />
                  </div>
                ) : (
                  <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{explanation}</p>
                )}
              </div>
            )}
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
