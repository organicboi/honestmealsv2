'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { 
    PlanType, 
    DialogueQuestion, 
    DialogueResponse 
} from '@/types/gymna.types';
import { DIET_PLAN_QUESTIONS, WORKOUT_PLAN_QUESTIONS } from '@/types/gymna.types';

interface DialogueFlowProps {
    planType: PlanType;
    onComplete: (responses: DialogueResponse[]) => void;
    onCancel: () => void;
}

export default function DialogueFlow({ planType, onComplete, onCancel }: DialogueFlowProps) {
    const questions = planType === 'diet' ? DIET_PLAN_QUESTIONS : WORKOUT_PLAN_QUESTIONS;
    const [currentStep, setCurrentStep] = useState(0);
    const [responses, setResponses] = useState<DialogueResponse[]>([]);
    const [currentAnswer, setCurrentAnswer] = useState<string | string[]>('');
    const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
    const [error, setError] = useState<string>('');

    const currentQuestion = questions[currentStep];
    const progress = ((currentStep + 1) / questions.length) * 100;

    const validateAnswer = (): boolean => {
        setError('');
        
        if (currentQuestion.validation?.required) {
            if (currentQuestion.type === 'multiselect') {
                if (selectedOptions.length === 0) {
                    setError('Please select at least one option');
                    return false;
                }
            } else if (!currentAnswer || currentAnswer === '') {
                setError('This field is required');
                return false;
            }
        }

        if (currentQuestion.type === 'number' && currentAnswer) {
            const num = Number(currentAnswer);
            if (currentQuestion.validation?.min && num < currentQuestion.validation.min) {
                setError(`Value must be at least ${currentQuestion.validation.min}`);
                return false;
            }
            if (currentQuestion.validation?.max && num > currentQuestion.validation.max) {
                setError(`Value must be at most ${currentQuestion.validation.max}`);
                return false;
            }
        }

        return true;
    };

    const handleNext = () => {
        if (!validateAnswer()) return;

        const answer = currentQuestion.type === 'multiselect' ? selectedOptions : currentAnswer;
        const newResponse: DialogueResponse = {
            questionId: currentQuestion.id,
            answer: answer
        };

        const updatedResponses = [...responses];
        const existingIndex = updatedResponses.findIndex(r => r.questionId === currentQuestion.id);
        
        if (existingIndex !== -1) {
            updatedResponses[existingIndex] = newResponse;
        } else {
            updatedResponses.push(newResponse);
        }
        
        setResponses(updatedResponses);

        if (currentStep < questions.length - 1) {
            setCurrentStep(currentStep + 1);
            // Load existing answer if going back
            const nextQuestion = questions[currentStep + 1];
            const existingResponse = updatedResponses.find(r => r.questionId === nextQuestion.id);
            if (existingResponse) {
                if (nextQuestion.type === 'multiselect') {
                    setSelectedOptions(existingResponse.answer as string[]);
                } else {
                    setCurrentAnswer(existingResponse.answer as string);
                }
            } else {
                setCurrentAnswer('');
                setSelectedOptions([]);
            }
            setError('');
        } else {
            // All questions answered - submit
            onComplete(updatedResponses);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
            const prevQuestion = questions[currentStep - 1];
            const existingResponse = responses.find(r => r.questionId === prevQuestion.id);
            if (existingResponse) {
                if (prevQuestion.type === 'multiselect') {
                    setSelectedOptions(existingResponse.answer as string[]);
                } else {
                    setCurrentAnswer(existingResponse.answer as string);
                }
            } else {
                setCurrentAnswer('');
                setSelectedOptions([]);
            }
            setError('');
        }
    };

    const toggleMultiSelect = (option: string) => {
        if (selectedOptions.includes(option)) {
            setSelectedOptions(selectedOptions.filter(o => o !== option));
        } else {
            setSelectedOptions([...selectedOptions, option]);
        }
    };

    return (
        <div className="fixed inset-0 z-70 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
            >
                {/* Header */}
                <div className="sticky top-0 bg-linear-to-br from-orange-500 to-red-500 p-6 rounded-t-3xl text-white z-10">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold">
                            {planType === 'diet' ? 'Diet Plan Generator' : 'Workout Plan Generator'}
                        </h2>
                        <button 
                            onClick={onCancel}
                            className="text-white/80 hover:text-white transition-colors text-sm"
                        >
                            Cancel
                        </button>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm text-white/90">
                            <span>Step {currentStep + 1} of {questions.length}</span>
                            <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="w-full bg-white/20 rounded-full h-2">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.3 }}
                                className="bg-white h-2 rounded-full"
                            />
                        </div>
                    </div>
                </div>

                {/* Question Content */}
                <div className="p-6 min-h-[400px]">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-6"
                        >
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                    {currentQuestion.question}
                                </h3>
                                {currentQuestion.validation?.required && (
                                    <p className="text-sm text-gray-500">* Required</p>
                                )}
                            </div>

                            {/* Input based on question type */}
                            {currentQuestion.type === 'select' && (
                                <div className="grid gap-3">
                                    {currentQuestion.options?.map((option) => (
                                        <button
                                            key={option}
                                            onClick={() => setCurrentAnswer(option)}
                                            className={`
                                                p-4 rounded-xl border-2 text-left font-medium transition-all
                                                ${currentAnswer === option
                                                    ? 'border-orange-500 bg-orange-50 text-orange-900'
                                                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                                                }
                                            `}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span>{option}</span>
                                                {currentAnswer === option && (
                                                    <Check className="h-5 w-5 text-orange-500" />
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {currentQuestion.type === 'multiselect' && (
                                <div className="grid gap-3">
                                    {currentQuestion.options?.map((option) => (
                                        <button
                                            key={option}
                                            onClick={() => toggleMultiSelect(option)}
                                            className={`
                                                p-4 rounded-xl border-2 text-left font-medium transition-all
                                                ${selectedOptions.includes(option)
                                                    ? 'border-orange-500 bg-orange-50 text-orange-900'
                                                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                                                }
                                            `}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span>{option}</span>
                                                {selectedOptions.includes(option) && (
                                                    <Check className="h-5 w-5 text-orange-500" />
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {(currentQuestion.type === 'text' || currentQuestion.type === 'number') && (
                                <Input
                                    type={currentQuestion.type === 'number' ? 'number' : 'text'}
                                    value={currentAnswer as string}
                                    onChange={(e) => setCurrentAnswer(e.target.value)}
                                    placeholder={currentQuestion.placeholder}
                                    className="h-14 text-lg rounded-xl border-2 focus:border-orange-500"
                                    autoFocus
                                />
                            )}

                            {error && (
                                <motion.p
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-red-500 text-sm font-medium"
                                >
                                    {error}
                                </motion.p>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Footer Actions */}
                <div className="sticky bottom-0 bg-gray-50 p-6 rounded-b-3xl border-t border-gray-100">
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={handleBack}
                            disabled={currentStep === 0}
                            className="flex-1 h-12 rounded-xl"
                        >
                            <ChevronLeft className="h-5 w-5 mr-2" />
                            Back
                        </Button>
                        
                        <Button
                            onClick={handleNext}
                            className="flex-1 h-12 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-lg shadow-orange-200"
                        >
                            {currentStep === questions.length - 1 ? (
                                <>
                                    <Check className="h-5 w-5 mr-2" />
                                    Generate Plan
                                </>
                            ) : (
                                <>
                                    Next
                                    <ChevronRight className="h-5 w-5 ml-2" />
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
