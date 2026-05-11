import React, { useState, useEffect, useCallback } from 'react';
import { 
  TrendingUp, 
  Users, 
  Calendar, 
  ShoppingBag, 
  Loader2,
  Clock,
  Layout,
  MousePointer2,
  Database,
  ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { useAuth } from './contexts/AuthContext';
import { useTranslation } from './contexts/TranslationContext';
import { Navigation, ProtectedAction } from './components/Auth';
import Dashboard from './components/Dashboard';
import BigDataDashboard from './components/BigDataDashboard';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from './lib/firebase';
import { OperationType, handleFirestoreError } from './lib/utils';
import { auth as firebaseAuth } from './lib/firebase';

// Prediction Input Types
interface PredictionInput {
  Administrative: number;
  Administrative_Duration: number;
  Informational: number;
  Informational_Duration: number;
  ProductRelated: number;
  ProductRelated_Duration: number;
  BounceRates: number;
  ExitRates: number;
  PageValues: number;
  SpecialDay: number;
  Month: string;
  OperatingSystems: number;
  Browser: number;
  Region: number;
  TrafficType: number;
  VisitorType: string;
  Weekend: string;
}

const INITIAL_INPUT: PredictionInput = {
  Administrative: 2,
  Administrative_Duration: 53.0,
  Informational: 0,
  Informational_Duration: 0.0,
  ProductRelated: 23,
  ProductRelated_Duration: 1668.28,
  BounceRates: 0.008,
  ExitRates: 0.016,
  PageValues: 15.0,
  SpecialDay: 0.0,
  Month: 'Nov',
  OperatingSystems: 2,
  Browser: 2,
  Region: 1,
  TrafficType: 2,
  VisitorType: 'Returning_Visitor',
  Weekend: 'FALSE'
};

export default function App() {
  const { user } = useAuth();
  const { t, language } = useTranslation();
  const [pyodide, setPyodide] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isBigDataOpen, setIsBigDataOpen] = useState(false);
  const [loadingStep, setLoadingStep] = useState(t('loading_python'));
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [bigDataStats, setBigDataStats] = useState<any>(null);
  const [prediction, setPrediction] = useState<{ result: boolean; probability: number } | null>(null);
  const [inputs, setInputs] = useState<PredictionInput>(INITIAL_INPUT);
  const [isPredicting, setIsPredicting] = useState(false);
  const [predictionError, setPredictionError] = useState<string | null>(null);

  // Initialize Pyodide
  useEffect(() => {
    async function init() {
      let retryCount = 0;
      const MAX_RETRIES = 2;

      while (retryCount <= MAX_RETRIES) {
        try {
          setLoadingStep(t('loading_python'));
          // @ts-ignore
          const py = await window.loadPyodide({
            indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/"
          });
          
          setLoadingStep(t('loading_packages'));
          // Load sequentially with explicit dependency order
          console.log("Loading base packages...");
          // Loading them in a single call often helps with dependency resolution and download timing
          await py.loadPackage(["numpy", "scipy", "pandas", "scikit-learn"]);
          
          setLoadingStep(t('app_title')); // Signal config
          const response = await fetch('/predictor.py');
          if (!response.ok) throw new Error(`Failed to fetch predictor.py: ${response.statusText}`);
          const code = await response.text();
          py.runPython(code);

          setLoadingStep(t('dataset_insights'));
          const csvResponse = await fetch('/data.csv');
          if (!csvResponse.ok) throw new Error(`Failed to fetch data.csv: ${csvResponse.statusText}`);
          const csvData = await csvResponse.text();

          setLoadingStep(t('training_model'));
          // Run training
          const predictor = py.globals.get('predictor');
          if (!predictor) throw new Error("Python 'predictor' object not found after running script.");
          
          const score = predictor.train(csvData);
          setAccuracy(score);

          // Load big data stats
          const statsJson = predictor.get_stats();
          setBigDataStats(JSON.parse(statsJson));

          setPyodide(py);
          setIsReady(true);
          return; // Success!
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          console.error(`Init attempt ${retryCount + 1} failed:`, err);
          
          if (errorMessage.includes('Failed to fetch')) {
             console.warn("Fetch error detected - possibly CDN or network instability.");
          }

          retryCount++;
          if (retryCount <= MAX_RETRIES) {
            setLoadingStep(`Retry ${retryCount}/${MAX_RETRIES}: ${errorMessage.substring(0, 30)}...`);
            await new Promise(r => setTimeout(r, 2000));
          } else {
            setLoadingStep(`Error: ${errorMessage}. Please check connection.`);
            console.error('Final failure after retries:', err);
          }
        }
      }
    }
    init().catch(err => {
      console.error("Critical initialization failure:", err);
      setLoadingStep('System crash. Please reload the page.');
    });
  }, [t]);

  const savePrediction = async (res: boolean, prob: number) => {
    if (!user) return;
    
    const path = 'predictions';
    try {
      await addDoc(collection(db, path), {
        userId: user.uid,
        timestamp: serverTimestamp(),
        features: {
          is_returning_customer: inputs.VisitorType === 'Returning_Visitor',
          basket_size: inputs.ProductRelated,
          time_on_site: inputs.ProductRelated_Duration,
          viewed_promo: inputs.PageValues > 0,
          is_weekend: inputs.Weekend === 'TRUE'
        },
        prediction: res,
        probability: prob,
        model_version: 'RandomForest-1.0'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path, firebaseAuth);
    }
  };

  const handlePredict = useCallback(async () => {
    if (!pyodide) return;
    setIsPredicting(true);
    setPredictionError(null);
    setPrediction(null);
    
    // Give UI a moment to show loading
    await new Promise(r => setTimeout(r, 800));

    try {
      console.log("Starting prediction with inputs:", inputs);
      const predictorObj = pyodide.globals.get('predictor');
      if (!predictorObj) {
        throw new Error("Model not initialized correctly.");
      }

      // Pass dict to python
      const pyInputs = pyodide.toPy(inputs);
      const result = predictorObj.predict(pyInputs);
      
      if (!result) {
        throw new Error("Prediction returned no result.");
      }

      const jsResult = result.toJs();
      console.log("Prediction result from Python:", jsResult);

      const willPay = jsResult[0];
      const prob = jsResult[1];
      
      setPrediction({ 
        result: Boolean(willPay), 
        probability: parseFloat(String(prob)) 
      });
      
      // Auto-save if logged in
      if (user) {
        try {
          await savePrediction(!!willPay, Number(prob));
        } catch (saveErr) {
          console.warn("Failed to auto-save prediction:", saveErr);
        }
      }
    } catch (err) {
      console.error('Prediction error:', err);
      setPredictionError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsPredicting(false);
    }
  }, [pyodide, inputs, user, t]);

  const updateInput = (key: keyof PredictionInput, value: any) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  };

  if (!isReady) {
    return (
      <div className="min-h-screen bg-[#F5F2ED] flex flex-col items-center justify-center p-8 font-serif text-[#1A1A1A]">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6"
        >
          <h1 className="text-5xl font-black uppercase tracking-tighter">{t('app_title')}</h1>
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-[#1A1A1A]" />
            <p className="text-sm font-mono uppercase tracking-widest text-[#1A1A1A] opacity-60 max-w-xs">{loadingStep}</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="bg-[#F5F2ED] text-[#1A1A1A] min-h-screen flex flex-col font-sans selection:bg-black selection:text-white">
      <Navigation onDashboardOpen={() => setIsDashboardOpen(true)} />
      
      <AnimatePresence>
        {isDashboardOpen && (
          <Dashboard onClose={() => setIsDashboardOpen(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isBigDataOpen && (
          <BigDataDashboard data={bigDataStats} onClose={() => setIsBigDataOpen(false)} />
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col p-2 md:p-12">
        <div className="border-[6px] md:border-[12px] border-[#1A1A1A] p-4 md:p-10 flex-1 flex flex-col bg-white shadow-2xl mt-16 max-w-[1700px] mx-auto w-full">
        
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b-2 border-black pb-8 mb-12 gap-6">
          <div className="md:w-2/3">
            <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 mb-2 whitespace-nowrap">Editorial Dashboard · Python v3.11</div>
            <h1 className="text-6xl md:text-8xl font-serif font-black tracking-tighter leading-[0.8] uppercase">{t('app_title')}</h1>
            <p className="text-lg md:text-2xl mt-4 font-medium italic opacity-70 serif text-[#1A1A1A]">
              {t('subtitle')}
            </p>
          </div>
          <div className="text-left md:text-right flex flex-col items-start md:items-end w-full md:w-auto">
            <div className="text-xs font-bold uppercase tracking-[0.2em] bg-black text-white px-3 py-1.5 mb-4 rounded-sm">
              ML Model · Random Forest 
            </div>
            <div className="font-mono text-[10px] space-y-1 opacity-60">
              <p>ENVIRONMENT: PYODIDE IN-BROWSER</p>
              <p>{t('accuracy').toUpperCase()}: {(accuracy! * 100).toFixed(2)}%</p>
              <p>STATUS: OPTIMIZED</p>
            </div>
          </div>
        </header>

        <main className="flex-1 grid grid-cols-1 xl:grid-cols-12 gap-12">
          <div className="xl:col-span-3 flex flex-col gap-10 border-b xl:border-b-0 xl:border-r border-gray-100 pb-12 xl:pb-0 xl:pr-12">
            <section>
              <SectionTitle index="01" title={t('dataset_insights')} />
              <div className="grid grid-cols-2 gap-8 mt-8">
                <div className="flex flex-col">
                  <span className="text-4xl font-serif font-bold tracking-tighter decoration-black underline decoration-4 underline-offset-4">{bigDataStats?.total_samples.toLocaleString() || '12,330'}</span>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400 mt-2">Historical Samples</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-4xl font-serif font-bold tracking-tighter decoration-black underline decoration-4 underline-offset-4">18</span>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400 mt-2">Target Features</span>
                </div>
              </div>
              <p className="text-sm leading-relaxed mt-8 text-gray-600 font-medium">
                Predicting user behavior based on Administrative, Information, and Product-related session attributes combined with real-time exit/bounce metrics.
              </p>
              
              <button 
                onClick={() => setIsBigDataOpen(true)}
                className="mt-8 flex items-center justify-between w-full p-4 border border-black hover:bg-black hover:text-white transition-all group font-bold text-[10px] uppercase tracking-widest"
              >
                <span>Full Big Data Dashboard</span>
                <ArrowUpRight className="w-4 h-4 group-hover:scale-125 transition-transform" />
              </button>
            </section>

            <section className="flex-1 flex flex-col">
              <SectionTitle index="02" title={t('feature_significance')} />
              <div className="mt-8 flex-1 bg-[#FBFBF9] p-6 border border-gray-100 rounded-sm flex flex-col justify-center">
                <div className="space-y-6">
                  <InfluenceBar label="Page Values" percent={84} />
                  <InfluenceBar label="Exit Rates" percent={18} />
                  <InfluenceBar label="Bounce Rates" percent={12} />
                  <InfluenceBar label="Pro Related" percent={9} />
                  <InfluenceBar label="Admin Duration" percent={5} />
                </div>
              </div>
            </section>
          </div>

          <div className="xl:col-span-6 flex flex-col gap-10">
            <section>
              <SectionTitle index="03" title={t('model_inputs')} />
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-8">
                {/* 1. Page Value & Promos */}
                <div className="space-y-6 col-span-full md:col-span-1 border-b md:border-b-0 lg:border-r border-zinc-100 pb-6 md:pb-0 lg:pr-6">
                  <h3 className="text-[10px] uppercase font-black tracking-widest text-black mb-4">Value & Target</h3>
                  <InputGroup label="Page Values" value={inputs.PageValues} onChange={(v) => updateInput('PageValues', parseFloat(v))} icon={<TrendingUp className="w-3 h-3" />} />
                  <InputGroup label="Special Day" value={inputs.SpecialDay} onChange={(v) => updateInput('SpecialDay', parseFloat(v))} icon={<TrendingUp className="w-3 h-3" />} placeholder="0.0 - 1.0" />
                  
                  <div className="space-y-3 pb-3 group pt-2">
                    <label className="text-[10px] uppercase font-bold tracking-[0.25em] text-zinc-300 flex items-center gap-2 group-hover:text-zinc-500 transition-colors truncate">
                      <Calendar className="w-3 h-3 shrink-0" />
                      Month
                    </label>
                    <select value={inputs.Month} onChange={(e) => updateInput('Month', e.target.value)} className="bg-transparent font-mono text-xl w-full border-none outline-none cursor-pointer appearance-none p-0 m-0 leading-none font-bold uppercase tracking-tighter">
                      {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(month => (
                         <option key={month} value={month}>{month.toUpperCase()} WINDOW</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 2. Page Activity */}
                <div className="space-y-6 col-span-full md:col-span-1 border-b md:border-b-0 lg:border-r border-zinc-100 pb-6 md:pb-0 lg:pr-6 lg:pl-2">
                  <h3 className="text-[10px] uppercase font-black tracking-widest text-black mb-4">Session Activity</h3>
                  <div className="grid grid-cols-2 gap-4 sm:gap-6">
                    <InputGroup label="Product Rel" value={inputs.ProductRelated} onChange={(v) => updateInput('ProductRelated', parseInt(v))} icon={<ShoppingBag className="w-3 h-3 shrink-0" />} />
                    <InputGroup label="Prod Dur" value={inputs.ProductRelated_Duration} onChange={(v) => updateInput('ProductRelated_Duration', parseFloat(v))} icon={<Clock className="w-3 h-3 shrink-0" />} />
                  </div>
                  <div className="grid grid-cols-2 gap-4 sm:gap-6">
                    <InputGroup label="Admin" value={inputs.Administrative} onChange={(v) => updateInput('Administrative', parseInt(v))} icon={<Layout className="w-3 h-3 shrink-0" />} />
                    <InputGroup label="Admin Dur" value={inputs.Administrative_Duration} onChange={(v) => updateInput('Administrative_Duration', parseFloat(v))} icon={<Clock className="w-3 h-3 shrink-0" />} />
                  </div>
                  <div className="grid grid-cols-2 gap-4 sm:gap-6">
                    <InputGroup label="Info" value={inputs.Informational} onChange={(v) => updateInput('Informational', parseInt(v))} icon={<Layout className="w-3 h-3 shrink-0" />} />
                    <InputGroup label="Info Dur" value={inputs.Informational_Duration} onChange={(v) => updateInput('Informational_Duration', parseFloat(v))} icon={<Clock className="w-3 h-3 shrink-0" />} />
                  </div>
                  <div className="grid grid-cols-2 gap-4 sm:gap-6">
                    <InputGroup label="Exit Rates" value={inputs.ExitRates} onChange={(v) => updateInput('ExitRates', parseFloat(v))} icon={<TrendingUp className="w-3 h-3 text-red-500 shrink-0" />} />
                    <InputGroup label="Bounce Rates" value={inputs.BounceRates} onChange={(v) => updateInput('BounceRates', parseFloat(v))} icon={<TrendingUp className="w-3 h-3 text-red-500 shrink-0" />} />
                  </div>
                </div>

                {/* 3. Tech & Demographics */}
                <div className="space-y-6 col-span-full md:col-span-2 lg:col-span-1 lg:pl-2">
                  <h3 className="text-[10px] uppercase font-black tracking-widest text-black mb-4">User Details</h3>
                  
                  <div className="space-y-3 pb-3 group">
                    <label className="text-[10px] uppercase font-bold tracking-[0.2em] text-gray-400 flex items-center gap-2 truncate">
                      <Users className="w-3 h-3 shrink-0" />
                      {language === 'zh' ? '访客类型' : 'Visitor Type'}
                    </label>
                    <div className="flex gap-3">
                      {['Returning_Visitor', 'New_Visitor', 'Other'].map(type => (
                        <button key={type} onClick={() => updateInput('VisitorType', type)} className={cn("text-[8px] sm:text-[9px] font-bold uppercase transition-all duration-300 relative pb-1", inputs.VisitorType === type ? "text-black border-b border-black" : "text-gray-400 hover:text-black border-b border-transparent")}>
                          {type === 'Returning_Visitor' ? 'Return' : type === 'New_Visitor' ? 'New' : 'Other'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <SelectGroup label="OS" value={inputs.OperatingSystems} onChange={(v) => updateInput('OperatingSystems', parseInt(v))} options={[1,2,3,4,5,6,7,8]} />
                    <SelectGroup label="Browser" value={inputs.Browser} onChange={(v) => updateInput('Browser', parseInt(v))} options={[1,2,3,4,5,6,7,8,9,10,11,12,13]} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <SelectGroup label="Region" value={inputs.Region} onChange={(v) => updateInput('Region', parseInt(v))} options={[1,2,3,4,5,6,7,8,9]} />
                    <SelectGroup label="Traffic Type" value={inputs.TrafficType} onChange={(v) => updateInput('TrafficType', parseInt(v))} options={[1,2,3,4,5,6,7,8,9,10,11,13,14,20]} />
                  </div>

                  <div className="space-y-4 pt-2">
                    <label className="text-[10px] uppercase font-bold tracking-[0.2em] text-gray-400 flex items-center gap-2 truncate">
                      <Clock className="w-3 h-3 shrink-0" />
                      {language === 'zh' ? '周末' : 'Weekend'}
                    </label>
                    <div className="flex gap-4">
                      {['TRUE', 'FALSE'].map(val => (
                        <button key={val} onClick={() => updateInput('Weekend', val)} className={cn("text-[9px] font-bold uppercase transition-all duration-300 relative pb-1", inputs.Weekend === val ? "text-black border-b border-black" : "text-gray-400 hover:text-black border-b border-transparent")}>
                          {val === 'TRUE' ? 'Yes' : 'No'}
                        </button>
                      ))}
                    </div>
                  </div>

                </div>
              </div>

              <button 
                onClick={handlePredict}
                disabled={isPredicting}
                className={cn(
                  "group relative mt-12 w-full py-6 px-8 font-bold text-sm tracking-[0.3em] uppercase transition-all active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-4",
                  isPredicting ? "bg-zinc-800 text-white" : "bg-black text-white hover:bg-zinc-800"
                )}
              >
                {isPredicting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>{t('execute')}</span>
                    <MousePointer2 className="w-4 h-4 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
                  </>
                )}
              </button>

              {predictionError && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-600 text-[10px] font-mono uppercase tracking-widest text-center">
                  Error: {predictionError}
                </div>
              )}
            </section>

            <AnimatePresence>
              {prediction && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-black text-white p-8 rounded-sm shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6"
                >
                  <div className="text-center sm:text-left">
                    <div className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-2 italic">{t('confidence')}</div>
                    <h3 className="font-serif text-6xl font-bold leading-none">
                      {(prediction.probability * 100).toFixed(1)}<span className="text-xl font-sans text-zinc-500 ml-1">%</span>
                    </h3>
                    <p className="text-[10px] font-bold uppercase mt-4 tracking-[0.2em] text-zinc-400">{language === 'zh' ? '成交倾向评估' : 'Transaction Propensity'}</p>
                  </div>
                  <div className="w-px h-16 bg-zinc-800 hidden sm:block" />
                  <div className="sm:w-1/3 text-center sm:text-right">
                    <p className="text-[10px] italic leading-relaxed text-zinc-400 font-medium">
                      Prediction outcome derived via Random Forest ensemble voting logic.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="xl:col-span-3 flex flex-col border-t xl:border-t-0 xl:border-l border-gray-100 pt-12 xl:pt-0 xl:pl-12">
            <div className="flex-1 flex flex-col items-center">
              <div className="text-center w-full space-y-12">
                <div className="flex flex-col items-center gap-6">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-[#B1B1B1]">{t('prediction_outcome')}</div>
                  <div className="w-48 h-40 flex items-center justify-center relative">
                     <div className={cn(
                       "absolute inset-0 rounded-sm border-2 border-zinc-100 transition-colors duration-1000",
                       prediction ? (prediction.probability >= 0.6 ? "bg-green-50 border-green-200" : (prediction.probability >= 0.3 ? "bg-yellow-50 border-yellow-200" : "bg-red-50 border-red-200")) : "bg-gray-50"
                     )} />
                     {prediction ? (
                       <motion.div 
                         key={prediction.probability}
                         initial={{ opacity: 0, y: 10 }}
                         animate={{ opacity: 1, y: 0 }}
                         className="flex flex-col items-center z-10 w-full px-4"
                       >
                         <span className={cn(
                           "font-serif font-black tracking-tighter text-center leading-[1.1]",
                           prediction.probability >= 0.6 ? "text-2xl" : "text-4xl"
                         )}>
                           {prediction.probability >= 0.6 ? 'yes！' : (prediction.probability >= 0.3 ? 'possible？' : 'no×')}
                         </span>
                         <span className="text-[10px] font-bold tracking-[0.4em] uppercase mt-4 opacity-40 italic">
                           Pred: {prediction.probability >= 0.6 ? '1' : '0'}
                         </span>
                       </motion.div>
                     ) : (
                       <div className="text-[#E0E0E0] italic text-sm relative z-10 uppercase font-black tracking-[0.2em]">{t('standby')}</div>
                     )}
                  </div>
                  <div className="text-[10px] font-black uppercase tracking-[0.2em]">
                    {prediction ? (prediction.result ? t('potential_revenue') : t('inert_session')) : t('pipeline_ready')}
                  </div>
                </div>

                <div className="pt-8 space-y-5 w-full text-left">
                  <ResultRow icon={<Layout className="w-3 h-3 text-zinc-300" />} label={t('source')} value="DIRECT" />
                  <ResultRow icon={<Calendar className="w-3 h-3 text-zinc-300" />} label={t('window')} value={inputs.Weekend === 'TRUE' ? t('weekend') : t('weekday')} />
                  <ResultRow icon={<Clock className="w-3 h-3 text-zinc-300" />} label={t('timescale')} value={inputs.Month.toUpperCase()} />
                </div>
              </div>

              <footer className="mt-auto pt-12 border-t border-zinc-100 w-full flex justify-between items-center opacity-30 group hover:opacity-100 transition-opacity">
                <div className="text-[9px] font-bold italic tracking-tight uppercase leading-tight">
                  ML ARCHITECTURE<br />PYTHON INFRASTRUCTURE
                </div>
                <div className="text-[9px] font-mono font-bold tracking-widest text-right">
                  PUBLISHED BY<br />CS RESEARCH
                </div>
              </footer>
            </div>
          </div>

        </main>
      </div>
    </div>
  </div>
);
}

function SectionTitle({ index, title }: { index: string; title: string }) {
  return (
    <div className="flex flex-col gap-4 shrink-0">
      <span className="text-[10px] font-black tracking-[0.5em] uppercase text-zinc-200">{index}</span>
      <h2 className="text-2xl font-serif font-black uppercase tracking-tight border-b-[6px] border-black pb-3 leading-none">
        {title}
      </h2>
    </div>
  );
}

function InfluenceBar({ label, percent }: { label: string; percent: number }) {
  return (
    <div className="group">
      <div className="flex justify-between items-end mb-2.5">
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-700">{label}</span>
        <span className="text-[10px] font-mono font-bold font-serif text-zinc-300 italic tracking-tighter">SIG. {percent}%</span>
      </div>
      <div className="h-[2px] bg-zinc-100 overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 2, ease: "circOut" }}
          className="h-full bg-black group-hover:bg-zinc-600 transition-colors" 
        />
      </div>
    </div>
  );
}

function InputGroup({ label, value, onChange, icon, placeholder }: { label: string; value: any; onChange: (v: string) => void; icon: React.ReactNode; placeholder?: string }) {
  return (
    <div className="space-y-3 border-b border-zinc-100 pb-3 hover:border-black transition-all duration-300 group overflow-hidden">
      <label className="text-[10px] uppercase font-bold tracking-[0.25em] text-zinc-300 flex items-center gap-2 group-hover:text-zinc-500 transition-colors truncate">
        {icon}
        {label}
      </label>
      <input 
        type="number" 
        step="any"
        value={Number.isNaN(value) ? '' : value} 
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent font-mono text-2xl w-full outline-none focus:text-zinc-500 transition-colors tracking-tighter p-0 m-0 leading-none"
      />
    </div>
  );
}

function SelectGroup({ label, value, onChange, options }: { label: string; value: number; onChange: (v: string) => void; options: number[] }) {
  return (
    <div className="space-y-3 border-b border-zinc-100 pb-3 hover:border-black transition-all duration-300 group overflow-hidden">
      <label className="text-[10px] uppercase font-bold tracking-[0.25em] text-zinc-300 flex items-center gap-2 group-hover:text-zinc-500 transition-colors truncate">
        {label}
      </label>
      <select 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent font-mono text-xl w-full border-none outline-none cursor-pointer appearance-none p-0 m-0 leading-none font-bold uppercase tracking-tighter"
      >
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}

function ResultRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-zinc-50">
      <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-3">
        {icon}
        {label}
      </span>
      <span className="text-[10px] font-mono bg-zinc-50 text-zinc-700 px-2 py-0.5 rounded-sm font-bold tracking-tight">
        {value}
      </span>
    </div>
  );
}
