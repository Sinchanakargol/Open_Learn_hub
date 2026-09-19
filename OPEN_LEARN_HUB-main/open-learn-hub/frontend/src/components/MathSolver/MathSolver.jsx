import React, { useRef, useState, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as math from 'mathjs';

const MathSolver = () => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [model, setModel] = useState(null);
  const [equation, setEquation] = useState('');
  const [solution, setSolution] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [modelTrained, setModelTrained] = useState(false);
  const [history, setHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showHistory, setShowHistory] = useState(true);
  const [canvasSize, setCanvasSize] = useState(400);

  useEffect(() => {
    // Load the CNN model when component mounts
    initializeModel();
    // Load history from localStorage
    loadHistory();
    // Set up responsive canvas
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle responsive canvas sizing
  const handleResize = () => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.offsetWidth;
      const size = Math.min(containerWidth - 32, 600); // Max 600px, min based on container
      setCanvasSize(size);
    }
  };

  // Load history from localStorage
  const loadHistory = () => {
    try {
      const savedHistory = localStorage.getItem('math-solver-history');
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  // Save history to localStorage
  const saveToHistory = (equation, result) => {
    const newEntry = {
      id: Date.now(),
      equation,
      result,
      timestamp: new Date().toISOString(),
      date: new Date().toLocaleString()
    };

    const updatedHistory = [newEntry, ...history];
    setHistory(updatedHistory);
    localStorage.setItem('math-solver-history', JSON.stringify(updatedHistory));
  };

  const initializeModel = async () => {
    try {
      // Try to load a previously trained model
      const loadedModel = await loadSavedModel();
      if (loadedModel) {
        setModel(loadedModel);
        setModelTrained(true);
        console.log('✅ Loaded pre-trained model from storage');
      } else {
        // Create a new model if no saved model exists
        await loadModel();
      }
    } catch (error) {
      console.error('Error initializing model:', error);
      await loadModel();
    }
  };

  const loadSavedModel = async () => {
    try {
      const model = await tf.loadLayersModel('indexeddb://math-solver-model');
      return model;
    } catch (error) {
      console.log('No pre-trained model found, will create new one');
      return null;
    }
  };

  const loadModel = async () => {
    try {
      // Create a LeNet-5 inspired model for digit recognition
      const model = tf.sequential({
        layers: [
          // First Conv Block
          tf.layers.conv2d({
            inputShape: [28, 28, 1],
            kernelSize: 5,
            filters: 6,
            activation: 'relu',
            padding: 'same'
          }),
          tf.layers.maxPooling2d({ poolSize: 2, strides: 2 }),
          tf.layers.batchNormalization(),
          
          // Second Conv Block
          tf.layers.conv2d({
            kernelSize: 5,
            filters: 16,
            activation: 'relu',
            padding: 'valid'
          }),
          tf.layers.maxPooling2d({ poolSize: 2, strides: 2 }),
          tf.layers.batchNormalization(),
          
          // Fully Connected Layers
          tf.layers.flatten(),
          tf.layers.dense({
            units: 120,
            activation: 'relu',
            kernelInitializer: 'varianceScaling'
          }),
          tf.layers.dropout({ rate: 0.2 }),
          tf.layers.dense({
            units: 84,
            activation: 'relu',
            kernelInitializer: 'varianceScaling'
          }),
          tf.layers.dropout({ rate: 0.2 }),
          tf.layers.dense({
            units: 16,
            activation: 'softmax',
            kernelInitializer: 'varianceScaling'
          })
        ]
      });

      // Compile the model
      model.compile({
        optimizer: 'adam',
        loss: 'sparseCategoricalCrossentropy',
        metrics: ['accuracy']
      });

      setModel(model);
      console.log('Model created successfully - ready for training');
      setModelTrained(false);
      
    } catch (error) {
      console.error('Error creating model:', error);
      console.error('Error stack:', error.stack);
    }
  };

  // Segment the canvas into individual symbols based on horizontal gaps
  const segmentSymbols = (canvas, ctx, imageData) => {
    const data = imageData.data;
    const width = canvas.width;
    const height = canvas.height;
    
    // Find columns with content
    const columnHasContent = new Array(width).fill(false);
    
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const i = (y * width + x) * 4;
        const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
        if (brightness < 250) {
          columnHasContent[x] = true;
          break;
        }
      }
    }
    
    // Find segments (groups of consecutive columns with content)
    const segments = [];
    let segmentStart = -1;
    
    for (let x = 0; x < width; x++) {
      if (columnHasContent[x] && segmentStart === -1) {
        segmentStart = x;
      } else if (!columnHasContent[x] && segmentStart !== -1) {
        segments.push({ start: segmentStart, end: x - 1 });
        segmentStart = -1;
      }
    }
    
    // Don't forget the last segment if it extends to the edge
    if (segmentStart !== -1) {
      segments.push({ start: segmentStart, end: width - 1 });
    }
    
    return segments;
  };
  
  // Process a single symbol segment
  const processSymbolSegment = async (canvas, segment) => {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Find vertical bounds within this segment
    let minY = canvas.height, maxY = 0;
    
    for (let y = 0; y < canvas.height; y++) {
      for (let x = segment.start; x <= segment.end; x++) {
        const i = (y * canvas.width + x) * 4;
        const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
        if (brightness < 250) {
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        }
      }
    }
    
    // Add padding
    const padding = 10;
    const minX = Math.max(0, segment.start - padding);
    const maxX = Math.min(canvas.width - 1, segment.end + padding);
    minY = Math.max(0, minY - padding);
    maxY = Math.min(canvas.height - 1, maxY + padding);
    
    const width = maxX - minX;
    const height = maxY - minY;
    const size = Math.max(width, height);
    
    // Create a temporary canvas for this symbol
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = size;
    tempCanvas.height = size;
    const tempCtx = tempCanvas.getContext('2d');
    
    // Center the content
    const offsetX = (size - width) / 2;
    const offsetY = (size - height) / 2;
    
    tempCtx.fillStyle = 'white';
    tempCtx.fillRect(0, 0, size, size);
    tempCtx.drawImage(
      canvas,
      minX, minY, width, height,
      offsetX, offsetY, width, height
    );
    
    // Convert to grayscale
    const tempImageData = tempCtx.getImageData(0, 0, size, size);
    const tempData = tempImageData.data;
    const grayscale = new Float32Array(size * size);
    
    for (let i = 0; i < tempData.length; i += 4) {
      const avg = (tempData[i] + tempData[i + 1] + tempData[i + 2]) / 3;
      grayscale[i / 4] = (255 - avg) / 255.0;
    }
    
    // Create tensor
    const tensor = tf.tidy(() => {
      const rawTensor = tf.tensor(grayscale)
        .reshape([size, size, 1])
        .resizeBilinear([28, 28])
        .expandDims(0);
      
      const mean = rawTensor.mean();
      const std = tf.moments(rawTensor).variance.sqrt();
      return rawTensor.sub(mean).div(std.add(1e-6));
    });
    
    // Get predictions
    const predictions = await model.predict(tensor).data();
    const recognizedSymbols = interpretPredictions(predictions, true); // Pass true to skip equation check
    
    tensor.dispose();
    
    return recognizedSymbols.length > 0 ? recognizedSymbols[0] : '';
  };

  const processCanvas = async () => {
    if (!model || !canvasRef.current) return;

    setIsLoading(true);
    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // Segment the canvas into individual symbols
      const segments = segmentSymbols(canvas, ctx, imageData);
      
      if (segments.length === 0) {
        console.log('No symbols detected');
        return;
      }
      
      console.log(`🔍 Detected ${segments.length} symbol(s)`);
      
      // Process each segment
      const recognizedSymbols = [];
      for (const segment of segments) {
        const symbol = await processSymbolSegment(canvas, segment);
        if (symbol) {
          recognizedSymbols.push(symbol);
        }
      }
      
      // Update equation with all recognized symbols
      if (recognizedSymbols.length > 0) {
        const newEquation = recognizedSymbols.join('');
        setEquation(newEquation);
        console.log(`✅ Recognized: ${newEquation}`);
        
        // Try to solve the equation
        solveEquation(newEquation);
      }
      
    } catch (error) {
      console.error('Error processing canvas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const interpretPredictions = (predictions, skipValidation = false) => {
    const symbols = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '+', '-', '*', '/', '=', '('];
    const predArray = Array.from(predictions);
    
    // Apply softmax to ensure probabilities sum to 1
    const expValues = predArray.map(val => Math.exp(val));
    const expSum = expValues.reduce((a, b) => a + b, 0);
    const softmaxProbs = expValues.map(val => val / expSum);
    
    // Get top 3 predictions with softmax probabilities
    const topK = 3;
    const indices = softmaxProbs
      .map((prob, idx) => ({ prob, idx }))
      .sort((a, b) => b.prob - a.prob)
      .slice(0, topK);
    
    // Log top predictions
    if (!modelTrained) {
      console.log('⚠️ Model is untrained - predictions are random (~6% confidence expected)');
    }
    indices.forEach(({ prob, idx }) => {
      console.log(`Predicted ${symbols[idx]} with confidence: ${(prob * 100).toFixed(2)}%`);
    });

    const topPred = indices[0];
    const secondPred = indices[1];
    
    // More sophisticated confidence check
    const isHighConfidence = topPred.prob > 0.4; // Lowered from 0.6 for better detection
    const hasGoodMargin = topPred.prob > secondPred.prob * 1.5; // Lowered from 2.0
    const isReasonableConfidence = topPred.prob > 0.15 && hasGoodMargin; // Lowered from 0.3
    
    if (isHighConfidence || isReasonableConfidence) {
      const symbol = symbols[topPred.idx];
      
      // Skip validation if requested (used during segmentation)
      if (skipValidation) {
        return [symbol];
      }
      
      const prevEq = equation || '';
      
      // Enhanced operator validation
      const isOperator = ['+', '-', '*', '/', '='].includes(symbol);
      const lastChar = prevEq[prevEq.length - 1];
      
      // Validation rules
      const isFirstChar = prevEq.length === 0;
      const isLastCharOperator = ['+', '-', '*', '/', '='].includes(lastChar);
      const isValidOperator = isOperator && !isFirstChar && !isLastCharOperator;
      const isValidDigit = !isOperator;
      
      if (isValidDigit || isValidOperator) {
        return [symbol];
      }
    }
    
    return [];
  };

  const solveEquation = (eq) => {
    try {
      // Only try to solve if equation looks complete (has operators or is just a number)
      if (!eq || eq.trim() === '') {
        setSolution(null);
        return;
      }
      
      const result = math.evaluate(eq);
      const solutionData = {
        result,
        steps: [`${eq} = ${result}`]
      };
      setSolution(solutionData);
      
      // Save to history
      saveToHistory(eq, result);
    } catch (error) {
      // Don't show error for incomplete equations
      console.log('Equation not ready to solve yet:', eq);
      setSolution(null);
    }
  };

  const clearCanvas = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      setEquation('');
      setSolution(null);
    }
  };

  // Get coordinates from mouse or touch event
  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Handle touch events
    if (e.touches && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    
    // Handle mouse events
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const coords = getCoordinates(e);
    
    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const coords = getCoordinates(e);
    
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000';
    
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopDrawing = (e) => {
    if (e) e.preventDefault();
    setIsDrawing(false);
  };

  // Generate synthetic training data for operators only
  const generateOperatorData = () => {
    const operators = ['+', '-', '*', '/', '=', '('];
    const samplesPerOperator = 200; // More samples for better accuracy
    const imageSize = 28;
    
    const images = [];
    const labels = [];

    operators.forEach((operator, opIdx) => {
      const labelIdx = 10 + opIdx; // Operators start after digits (0-9)
      
      for (let sample = 0; sample < samplesPerOperator; sample++) {
        const canvas = document.createElement('canvas');
        canvas.width = imageSize;
        canvas.height = imageSize;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, imageSize, imageSize);
        
        // Vary fonts for better generalization
        const fonts = ['Arial', 'Helvetica', 'Times New Roman', 'Courier New', 'Verdana'];
        const font = fonts[Math.floor(Math.random() * fonts.length)];
        const fontSize = 16 + Math.random() * 6; // 16-22px
        const weight = Math.random() > 0.5 ? 'bold' : 'normal';
        
        ctx.fillStyle = 'black';
        ctx.font = `${weight} ${fontSize}px ${font}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Random position and rotation
        const offsetX = imageSize / 2 + (Math.random() - 0.5) * 6;
        const offsetY = imageSize / 2 + (Math.random() - 0.5) * 6;
        
        ctx.save();
        ctx.translate(offsetX, offsetY);
        ctx.rotate((Math.random() - 0.5) * 0.3); // More rotation variety
        ctx.fillText(operator, 0, 0);
        ctx.restore();
        
        // Convert to grayscale
        const imageData = ctx.getImageData(0, 0, imageSize, imageSize);
        const grayscale = new Float32Array(imageSize * imageSize);
        
        for (let i = 0; i < imageData.data.length; i += 4) {
          const avg = (imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2]) / 3;
          grayscale[i / 4] = (255 - avg) / 255.0;
        }
        
        images.push(grayscale);
        labels.push(labelIdx);
      }
    });

    return { images, labels };
  };
  
  // Generate high-quality training data with synthetic approach
  const loadMNISTData = async () => {
    console.log('🎨 Generating high-quality synthetic training data...');
    return generateSyntheticFallback();
  };
  
  // Fallback: Generate all synthetic data if MNIST fails
  const generateSyntheticFallback = () => {
    console.log('⚠️ Using synthetic data for all symbols...');
    const symbols = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '+', '-', '*', '/', '=', '('];
    const samplesPerSymbol = 250; // Increased for better training
    const imageSize = 28;
    
    const images = [];
    const labels = [];

    symbols.forEach((symbol, symbolIdx) => {
      for (let sample = 0; sample < samplesPerSymbol; sample++) {
        const canvas = document.createElement('canvas');
        canvas.width = imageSize;
        canvas.height = imageSize;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, imageSize, imageSize);
        
        const fonts = ['Arial', 'Helvetica', 'Times New Roman', 'Courier New', 'Verdana', 'Georgia'];
        const font = fonts[Math.floor(Math.random() * fonts.length)];
        const fontSize = 14 + Math.random() * 8;
        const weight = Math.random() > 0.3 ? 'bold' : 'normal';
        
        ctx.fillStyle = 'black';
        ctx.font = `${weight} ${fontSize}px ${font}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const offsetX = imageSize / 2 + (Math.random() - 0.5) * 6;
        const offsetY = imageSize / 2 + (Math.random() - 0.5) * 6;
        
        ctx.save();
        ctx.translate(offsetX, offsetY);
        ctx.rotate((Math.random() - 0.5) * 0.35);
        ctx.fillText(symbol, 0, 0);
        ctx.restore();
        
        const imageData = ctx.getImageData(0, 0, imageSize, imageSize);
        const grayscale = new Float32Array(imageSize * imageSize);
        
        for (let i = 0; i < imageData.data.length; i += 4) {
          const avg = (imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2]) / 3;
          grayscale[i / 4] = (255 - avg) / 255.0;
        }
        
        images.push(grayscale);
        labels.push(symbolIdx);
      }
    });

    return { images, labels, numClasses: symbols.length };
  };

  const trainModel = async () => {
    if (!model) {
      console.error('Model not initialized');
      return;
    }

    setIsTraining(true);
    setTrainingProgress(0);

    try {
      console.log('🚀 Loading training data...');
      const { images, labels, numClasses } = await loadMNISTData();
      
      console.log(`📊 Generated ${images.length} training samples for ${numClasses} symbols`);

      // Convert to tensors
      // Flatten all images into a single Float32Array
      const totalSize = images.length * 28 * 28;
      const flattenedData = new Float32Array(totalSize);
      
      images.forEach((img, idx) => {
        flattenedData.set(img, idx * 28 * 28);
      });
      
      const xs = tf.tensor4d(flattenedData, [images.length, 28, 28, 1]);
      const ys = tf.tensor1d(labels, 'float32');

      console.log('🎯 Starting training...');
      
      // Train the model with more epochs for better convergence
      const epochs = 30; // Increased from 20
      const batchSize = 32;
      
      await model.fit(xs, ys, {
        epochs,
        batchSize,
        shuffle: true,
        validationSplit: 0.2,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            const progress = ((epoch + 1) / epochs) * 100;
            setTrainingProgress(progress);
            console.log(
              `Epoch ${epoch + 1}/${epochs} - ` +
              `Loss: ${logs.loss.toFixed(4)}, ` +
              `Accuracy: ${(logs.acc * 100).toFixed(2)}%, ` +
              `Val Loss: ${logs.val_loss.toFixed(4)}, ` +
              `Val Accuracy: ${(logs.val_acc * 100).toFixed(2)}%`
            );
          }
        }
      });

      // Clean up tensors
      xs.dispose();
      ys.dispose();

      // Save the trained model
      await model.save('indexeddb://math-solver-model');
      console.log('✅ Model trained and saved successfully!');
      
      setModelTrained(true);
      setIsTraining(false);
      setTrainingProgress(100);
      
    } catch (error) {
      console.error('Error training model:', error);
      setIsTraining(false);
    }
  };

  const resetModel = async () => {
    try {
      // Delete the saved model
      await tf.io.removeModel('indexeddb://math-solver-model');
      console.log('🗑️ Deleted saved model');
      
      // Reload a fresh model
      if (model) {
        model.dispose();
      }
      await loadModel();
      setModelTrained(false);
      setTrainingProgress(0);
    } catch (error) {
      console.error('Error resetting model:', error);
    }
  };

  // Download trained model
  const downloadModel = async () => {
    if (!model || !modelTrained) {
      alert('⚠️ Please train the model first before downloading!');
      return;
    }

    try {
      console.log('📥 Preparing model for download...');
      
      // Save model to downloads using the browser's download manager
      await model.save('downloads://math-solver-model');
      
      console.log('✅ Model downloaded successfully!');
      alert('✅ Model downloaded! Check your Downloads folder for:\n- model.json\n- model.weights.bin');
    } catch (error) {
      console.error('Error downloading model:', error);
      alert('❌ Error downloading model. Please try again.');
    }
  };

  // Upload custom model
  const uploadModel = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    try {
      console.log('📤 Uploading custom model...');
      setIsLoading(true);

      // Create file handler for TensorFlow.js
      const uploadedModel = await tf.loadLayersModel(tf.io.browserFiles(
        [...files].filter(f => f.name.endsWith('.json'))[0],
        [...files].filter(f => f.name.endsWith('.bin'))
      ));

      // Dispose old model
      if (model) {
        model.dispose();
      }

      // Set new model
      setModel(uploadedModel);
      setModelTrained(true);
      
      // Save to IndexedDB for persistence
      await uploadedModel.save('indexeddb://math-solver-model');
      
      console.log('✅ Model uploaded and saved successfully!');
      alert('✅ Custom model loaded successfully!\nThe model is now ready to use.');
      
      // Clear file input
      event.target.value = '';
    } catch (error) {
      console.error('Error uploading model:', error);
      alert('❌ Error loading model. Please ensure you selected both .json and .bin files.');
    } finally {
      setIsLoading(false);
    }
  };

  // Clear all history
  const clearHistory = () => {
    if (window.confirm('Are you sure you want to clear all equation history?')) {
      setHistory([]);
      localStorage.removeItem('math-solver-history');
      console.log('✅ History cleared');
    }
  };

  // Delete single history entry
  const deleteHistoryEntry = (id) => {
    const updatedHistory = history.filter(entry => entry.id !== id);
    setHistory(updatedHistory);
    localStorage.setItem('math-solver-history', JSON.stringify(updatedHistory));
  };

  // Export history to text file
  const exportHistory = () => {
    if (history.length === 0) {
      alert('⚠️ No history to export!');
      return;
    }

    const content = history.map(entry => 
      `${entry.date}\n${entry.equation} = ${entry.result}\n---`
    ).join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `math-history-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    console.log('✅ History exported');
  };

  // Filter history by search term
  const filteredHistory = history.filter(entry =>
    entry.equation.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.result.toString().toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto p-2 sm:p-4" ref={containerRef}>
      <h2 className="text-xl sm:text-2xl font-bold mb-4">Math Solver</h2>
      
      {/* Model Training Section */}
      <div className="border rounded-lg p-3 sm:p-4 mb-4 bg-gradient-to-r from-purple-50 to-pink-50">
        <h3 className="font-semibold mb-2 flex flex-wrap items-center gap-2 text-sm sm:text-base">
          <span>🧠 Model Training</span>
          {modelTrained && <span className="text-green-600 text-xs sm:text-sm">✅ Trained</span>}
          {!modelTrained && <span className="text-orange-600 text-xs sm:text-sm">⚠️ Untrained</span>}
        </h3>
        <p className="text-xs sm:text-sm text-gray-600 mb-3">
          {modelTrained 
            ? 'Model is trained and ready to recognize your drawings!' 
            : 'Train the model to recognize handwritten digits and math symbols.'}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 items-start">
          <button
            onClick={trainModel}
            disabled={isTraining || modelTrained}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base whitespace-nowrap"
          >
            {isTraining ? '🔄 Training...' : modelTrained ? '✓ Model Trained' : '🚀 Train Model'}
          </button>
          {modelTrained && (
            <button
              onClick={resetModel}
              disabled={isTraining}
              className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50 text-sm sm:text-base whitespace-nowrap"
            >
              🔄 Retrain Model
            </button>
          )}
          {modelTrained && (
            <button
              onClick={downloadModel}
              disabled={isTraining}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 text-sm sm:text-base whitespace-nowrap"
            >
              📥 Download Model
            </button>
          )}
          <div className="relative">
            <input
              type="file"
              id="model-upload"
              multiple
              accept=".json,.bin"
              onChange={uploadModel}
              className="hidden"
            />
            <label
              htmlFor="model-upload"
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 cursor-pointer inline-block text-sm sm:text-base whitespace-nowrap w-full text-center"
            >
              📤 Upload Model
            </label>
          </div>
        </div>
        {isTraining && (
          <div className="mt-3">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-purple-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${trainingProgress}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-600 mt-1">{Math.round(trainingProgress)}% complete</p>
          </div>
        )}
        <p className="text-xs text-gray-500 mt-2">
          💡 Tip: Download your trained model to share with others or as a backup!
        </p>
      </div>

      {/* Text Input Alternative */}
      <div className="border rounded-lg p-3 sm:p-4 mb-4 bg-blue-50">
        <h3 className="font-semibold mb-2 text-sm sm:text-base">Quick Solve (Type Your Equation)</h3>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={equation}
            onChange={(e) => setEquation(e.target.value)}
            placeholder="e.g., 2 + 3 * 4"
            className="flex-1 px-3 sm:px-4 py-2 border rounded text-sm sm:text-base"
            onKeyPress={(e) => e.key === 'Enter' && solveEquation(equation)}
          />
          <div className="flex gap-2">
            <button
              onClick={() => solveEquation(equation)}
              className="flex-1 sm:flex-none px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm sm:text-base whitespace-nowrap"
            >
              Solve
            </button>
            <button
              onClick={() => { setEquation(''); setSolution(null); }}
              className="flex-1 sm:flex-none px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm sm:text-base whitespace-nowrap"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      <div className="border rounded-lg p-3 sm:p-4 mb-4">
        <h3 className="font-semibold mb-2 text-sm sm:text-base flex flex-wrap items-center gap-1">
          <span>Draw Your Equation</span>
          {!modelTrained && <span className="text-orange-600 text-xs sm:text-sm">(⚠️ Train model first)</span>}
          {modelTrained && <span className="text-green-600 text-xs sm:text-sm">(✅ Ready)</span>}
        </h3>
        <div className="flex justify-center mb-2">
          <canvas
            ref={canvasRef}
            width={canvasSize}
            height={canvasSize}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            onTouchCancel={stopDrawing}
            className="border-2 border-gray-300 rounded cursor-crosshair bg-white max-w-full"
            style={{ touchAction: 'none', display: 'block' }}
          />
        </div>
        <div className="flex gap-2 mt-2">
          <button
            onClick={processCanvas}
            disabled={isLoading || !modelTrained}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base whitespace-nowrap"
          >
            {isLoading ? 'Processing...' : 'Solve'}
          </button>
          <button
            onClick={clearCanvas}
            className="flex-1 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm sm:text-base whitespace-nowrap"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="mt-4 sm:mt-6 space-y-4">
        {equation && (
          <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
            <h3 className="text-base sm:text-lg font-semibold text-gray-700">Recognized Expression:</h3>
            <p className="text-xl sm:text-2xl md:text-3xl font-mono mt-2 break-all">{equation}</p>
            {equation && !solution && (
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Continue drawing or click Solve to evaluate
              </p>
            )}
          </div>
        )}

        {solution && (
          <div className="p-3 sm:p-4 bg-white rounded-lg border-2 border-blue-100">
            <h3 className="text-base sm:text-lg font-semibold text-gray-700">Solution:</h3>
            {solution.error ? (
              <div className="mt-2">
                <p className="text-red-500 text-sm sm:text-base">{solution.error}</p>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  Try clearing and drawing a complete mathematical expression
                </p>
              </div>
            ) : (
              <div className="space-y-2 mt-2">
                {solution.steps.map((step, index) => (
                  <p key={index} className="text-lg sm:text-xl md:text-2xl font-mono break-all">{step}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Equation History Section */}
      <div className="border rounded-lg p-3 sm:p-4 mb-4 bg-gradient-to-r from-green-50 to-blue-50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold flex items-center gap-2 text-sm sm:text-base">
            <span>📜 Equation History</span>
            <span className="text-xs sm:text-sm text-gray-600">({history.length})</span>
          </h3>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 whitespace-nowrap"
          >
            {showHistory ? '▼ Hide' : '▶ Show'}
          </button>
        </div>

        {showHistory && (
          <>
            {/* Search and Actions */}
            <div className="flex flex-col sm:flex-row gap-2 mb-3">
              <input
                type="text"
                placeholder="🔍 Search history..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 min-w-0 px-3 py-2 border rounded text-sm"
              />
              <div className="flex gap-2">
                <button
                  onClick={exportHistory}
                  disabled={history.length === 0}
                  className="flex-1 sm:flex-none px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 text-xs sm:text-sm whitespace-nowrap"
                >
                  📥 Export
                </button>
                <button
                  onClick={clearHistory}
                  disabled={history.length === 0}
                  className="flex-1 sm:flex-none px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 text-xs sm:text-sm whitespace-nowrap"
                >
                  🗑️ Clear All
                </button>
              </div>
            </div>

            {/* History List */}
            <div className="max-h-96 overflow-y-auto space-y-2">
              {filteredHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-xs sm:text-sm">
                  {searchTerm ? (
                    <p>No results found for "{searchTerm}"</p>
                  ) : (
                    <p>No equations solved yet. Start drawing to build your history!</p>
                  )}
                </div>
              ) : (
                filteredHistory.map((entry) => (
                  <div
                    key={entry.id}
                    className="bg-white p-2 sm:p-3 rounded border hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-mono text-sm sm:text-base md:text-lg font-semibold text-gray-800 break-all">
                          {entry.equation} = {entry.result}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {entry.date}
                        </div>
                      </div>
                      <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                        <button
                          onClick={() => {
                            setEquation(entry.equation);
                            solveEquation(entry.equation);
                          }}
                          className="text-blue-600 hover:text-blue-800 text-base sm:text-lg p-1"
                          title="Load this equation"
                        >
                          🔄
                        </button>
                        <button
                          onClick={() => deleteHistoryEntry(entry.id)}
                          className="text-red-600 hover:text-red-800 text-base sm:text-lg p-1"
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {filteredHistory.length > 0 && searchTerm && (
              <p className="text-xs text-gray-500 mt-2">
                Showing {filteredHistory.length} of {history.length} equations
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MathSolver;