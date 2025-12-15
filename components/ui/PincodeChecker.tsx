'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MapPin, Check, X, Clock, Truck, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePincode } from '@/context/PincodeContext';
import { motion, AnimatePresence } from 'framer-motion';

interface PincodeCheckerProps {
  className?: string;
  compact?: boolean;
}

export default function PincodeChecker({ className = '', compact = false }: PincodeCheckerProps) {
  const { 
    currentPincode, 
    pincodeResult, 
    isChecking, 
    isServiceable, 
    nearbyPincodes,
    isTemporary,
    checkPincode,
    selectTemporaryPincode
  } = usePincode();
  
  const [inputPincode, setInputPincode] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputPincode.trim().length !== 6) return;
    
    const result = await checkPincode(inputPincode.trim());
    setShowResult(true);
    
    // Auto-collapse removed as per new design requirements
  };

  const handleLocationClick = () => {
    if (compact) {
      setIsExpanded(!isExpanded);
      setShowResult(false);
    }
  };

  if (compact) {
    return (
      <div className={`relative ${className}`}>
        <div 
          onClick={handleLocationClick}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-green-600 cursor-pointer transition-colors group"
        >
          <MapPin className="h-4 w-4 shrink-0" />
          <span className="font-medium truncate max-w-[120px] sm:max-w-[150px]">
            {currentPincode && isServiceable 
              ? `${pincodeResult?.city || 'Service Available'} (${currentPincode})` 
              : "Check Delivery"}
          </span>
          <ChevronDown className={`h-3 w-3 shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute top-full right-0 mt-2 bg-white border border-gray-100 rounded-3xl shadow-xl shadow-green-200/20 p-5 w-[calc(100vw-2rem)] max-w-sm z-[60]"
            >
              {!showResult ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
                      Enter your pincode
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Input
                        type="text"
                        placeholder="e.g., 411048"
                        value={inputPincode}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                          setInputPincode(value);
                        }}
                        className="flex-1 h-12 bg-gray-50 border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
                        maxLength={6}
                      />
                      <Button 
                        type="submit" 
                        disabled={inputPincode.length !== 6 || isChecking}
                        className="bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-lg shadow-green-200 h-12 w-full sm:w-auto sm:px-6"
                      >
                        {isChecking ? 'Checking...' : 'Check'}
                      </Button>
                    </div>
                  </div>
                </form>
              ) : (
                <div>
                  <PincodeResult 
                    result={pincodeResult} 
                    pincode={inputPincode}
                    onClose={() => setShowResult(false)}
                  />
                  {nearbyPincodes.length > 0 && !isServiceable && (
                    <NearbyPincodes 
                      pincodes={nearbyPincodes}
                      onSelect={(pincode, data) => {
                        selectTemporaryPincode(pincode, data);
                        setShowResult(false);
                        setIsExpanded(false);
                      }}
                    />
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Full component for dedicated pincode check pages
  return (
    <div className={`max-w-md mx-auto ${className}`}>
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
            <MapPin className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Check Delivery</h3>
            <p className="text-sm text-gray-500">Enter your pincode to see if we deliver</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type="text"
              placeholder="Enter 6-digit pincode"
              value={inputPincode}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                setInputPincode(value);
              }}
              className="w-full"
              maxLength={6}
            />
          </div>
          
          <Button 
            type="submit" 
            disabled={inputPincode.length !== 6 || isChecking}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {isChecking ? 'Checking Delivery...' : 'Check Delivery'}
          </Button>
        </form>

        {pincodeResult && (
          <div className="mt-4">
            <PincodeResult result={pincodeResult} pincode={inputPincode} />
          </div>
        )}
      </div>
    </div>
  );
}

function PincodeResult({ 
  result, 
  pincode, 
  onClose 
}: { 
  result: any; 
  pincode: string;
  onClose?: () => void;
}) {
  const isServiceable = result?.is_serviceable;
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`p-4 rounded-xl border ${
        isServiceable 
          ? 'bg-green-50/50 border-green-200' 
          : 'bg-red-50/50 border-red-200'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 h-6 w-6 rounded-full flex items-center justify-center shrink-0 ${
            isServiceable ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
          }`}>
            {isServiceable ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <X className="h-3.5 w-3.5" />
            )}
          </div>
          <div>
            <h5 className={`font-semibold text-sm ${isServiceable ? 'text-green-900' : 'text-red-900'}`}>
              {isServiceable ? 'Delivery Available' : 'Not Serviceable'}
            </h5>
            <p className={`text-xs mt-0.5 ${isServiceable ? 'text-green-700' : 'text-red-700'}`}>
              {result?.message || (isServiceable 
                ? `We deliver to ${pincode}` 
                : `Sorry, we don't deliver to ${pincode} yet.`)}
            </p>
          </div>
        </div>
        {onClose && (
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 p-1 hover:bg-black/5 rounded-full transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isServiceable && result && (
        <div className="mt-4 pt-3 border-t border-green-200/60 grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider text-green-600 font-medium">Delivery Time</span>
            <div className="flex items-center gap-1.5 text-green-900">
              <Clock className="h-3.5 w-3.5" />
              <span className="text-sm font-semibold">{result.delivery_hours} Hours</span>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider text-green-600 font-medium">Delivery Fee</span>
            <div className="flex items-center gap-1.5 text-green-900">
              <Truck className="h-3.5 w-3.5" />
              <span className="text-sm font-semibold">
                {result.delivery_fee > 0 ? `₹${result.delivery_fee}` : 'Free'}
              </span>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function NearbyPincodes({ 
  pincodes, 
  onSelect 
}: { 
  pincodes: any[];
  onSelect: (pincode: string, data: any) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <div className="mt-4">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-3xl p-5 text-center shadow-sm">
           <div className="flex justify-center mb-3">
             <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center shadow-md">
               <MapPin className="h-6 w-6 text-green-600" />
             </div>
           </div>
           <h4 className="font-bold text-gray-900 text-base mb-1.5">
             Not serviceable here?
           </h4>
           <p className="text-sm text-gray-600 mb-4">
             We deliver to {pincodes.length} nearby locations.
           </p>
           <Button 
             onClick={() => setIsOpen(true)}
             className="w-full h-12 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-lg shadow-green-200"
           >
             View Available Areas
           </Button>
        </div>
      </div>

      {mounted && createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            >
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] sm:max-h-[85vh] flex flex-col overflow-hidden"
              >
                <div className="p-4 sm:p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white z-10 relative">
                  {/* Mobile Drag Handle Indicator */}
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-300 rounded-full sm:hidden" />
                  
                  <div className="mt-4 sm:mt-0 flex-1">
                    <h3 className="font-bold text-xl sm:text-2xl text-gray-900 mb-1">Nearby Serviceable Areas</h3>
                    <p className="text-sm sm:text-base text-gray-500">Select a location to proceed with your order</p>
                  </div>
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="absolute top-4 right-4 sm:relative sm:top-0 sm:right-0 h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="p-4 sm:p-5 overflow-y-auto bg-gray-50 custom-scrollbar">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {pincodes.map((item, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          onSelect(item.pincode, {
                            is_serviceable: true,
                            delivery_fee: item.delivery_fee,
                            delivery_hours: item.standard_delivery_hours,
                            city: item.city,
                            state: item.state,
                            zone_type: item.zone_type,
                            min_order_amount: item.min_order_amount,
                            free_delivery_threshold: item.free_delivery_threshold,
                            message: `Great! We deliver to ${item.city}, ${item.state} in ${item.standard_delivery_hours} hours`
                          });
                          setIsOpen(false);
                        }}
                        className="bg-white border border-gray-200 rounded-3xl p-4 sm:p-5 hover:border-green-500 hover:shadow-lg hover:shadow-green-200/30 transition-all duration-200 group text-left relative overflow-hidden flex flex-col h-full min-h-[140px]"
                      >
                        <div className="absolute top-0 right-0 w-20 h-20 bg-green-50 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-150" />
                        
                        <div className="relative z-10 mb-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-2xl sm:text-xl text-gray-900">{item.pincode}</span>
                            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <MapPin className="h-4 w-4 text-green-600" />
                            </div>
                          </div>
                          <div className="text-base sm:text-sm text-gray-700 font-semibold truncate mb-1" title={item.area_name || item.city}>
                            {item.area_name || item.city}
                          </div>
                          <div className="text-sm sm:text-xs text-gray-500">
                            {item.city}, {item.state}
                          </div>
                        </div>
                        
                        <div className="relative z-10 mt-auto pt-3 border-t border-gray-200 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center">
                              <Truck className="h-4 w-4 text-green-600" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Fee</span>
                              <span className="text-base sm:text-sm font-bold text-green-700">
                                {item.delivery_fee > 0 ? `₹${item.delivery_fee}` : 'Free'}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                              <Clock className="h-4 w-4 text-blue-600" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Time</span>
                              <span className="text-base sm:text-sm font-bold text-gray-900">
                                {item.standard_delivery_hours}h
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="p-4 sm:p-5 border-t border-gray-200 bg-gradient-to-br from-gray-50 to-white text-center">
                  <p className="text-xs sm:text-sm text-gray-500 font-medium">
                    💡 Selecting a location will set it as your temporary delivery area
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}