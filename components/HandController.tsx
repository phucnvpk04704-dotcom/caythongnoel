import React, { useEffect, useRef } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { useStore } from '../store';

export const HandController = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { setHandPosition, setGesture, setMode, mode, setFocusedImage, images } = useStore();
  const lastGestureRef = useRef<string>('None');

  useEffect(() => {
    let handLandmarker: HandLandmarker | null = null;
    let animationFrameId: number;

    const setupMediaPipe = async () => {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
      );
      
      handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numHands: 1
      });

      startWebcam();
    };

    const startWebcam = async () => {
      if (!videoRef.current) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoRef.current.srcObject = stream;
        videoRef.current.addEventListener('loadeddata', predictWebcam);
      } catch (err) {
        console.error("Camera denied", err);
      }
    };

    const predictWebcam = () => {
      if (!handLandmarker || !videoRef.current) return;
      
      const startTimeMs = performance.now();
      if (videoRef.current.currentTime > 0) {
        const results = handLandmarker.detectForVideo(videoRef.current, startTimeMs);
        
        if (results.landmarks && results.landmarks.length > 0) {
          const landmarks = results.landmarks[0];
          
          // 1. Calculate Centroid (Hand Position)
          // Index 9 is the MCP of middle finger (center of palm roughly)
          const centerX = landmarks[9].x; 
          const centerY = landmarks[9].y;
          
          // Map to -1 to 1 range (MediaPipe gives 0 to 1)
          // X is mirrored in webcam usually, so we flip it
          const x = (centerX - 0.5) * 2; 
          const y = -(centerY - 0.5) * 2; 

          setHandPosition(x, y);

          // 2. Gesture Recognition
          const gesture = detectGesture(landmarks);
          
          if (gesture !== lastGestureRef.current) {
            handleGestureChange(gesture);
            lastGestureRef.current = gesture;
            setGesture(gesture);
          }
        } else {
            setGesture('None');
            lastGestureRef.current = 'None';
        }
      }
      animationFrameId = requestAnimationFrame(predictWebcam);
    };

    const detectGesture = (landmarks: any[]) => {
      // Simple heuristic geometry
      
      // Tips vs PIPs (Proximal Interphalangeal Joints)
      const isThumbOpen = landmarks[4].x < landmarks[3].x; // Assuming right hand logic approx, simplified
      // Better: Check distance from tip to wrist (0)
      const wrist = landmarks[0];
      
      const tips = [8, 12, 16, 20]; // Index, Middle, Ring, Pinky
      const pips = [6, 10, 14, 18];
      
      let extendedFingers = 0;
      for (let i = 0; i < 4; i++) {
        // If tip is further from wrist than pip, it's extended
        const distTip = Math.hypot(landmarks[tips[i]].x - wrist.x, landmarks[tips[i]].y - wrist.y);
        const distPip = Math.hypot(landmarks[pips[i]].x - wrist.x, landmarks[pips[i]].y - wrist.y);
        if (distTip > distPip) extendedFingers++;
      }

      // Check Pinch (Thumb tip 4 close to Index tip 8)
      const pinchDist = Math.hypot(landmarks[4].x - landmarks[8].x, landmarks[4].y - landmarks[8].y);
      
      if (pinchDist < 0.05) return 'Pinch';
      if (extendedFingers === 0) return 'Fist';
      if (extendedFingers === 4) return 'Open';
      
      return 'Neutral';
    };

    const handleGestureChange = (newGesture: string) => {
      if (newGesture === 'Fist') {
        setMode('tree');
        setFocusedImage(null);
      } else if (newGesture === 'Open') {
        setMode('dispersed');
        setFocusedImage(null);
      } else if (newGesture === 'Pinch') {
         // Logic for grabbing a photo
         // In a real app, we'd raycast. Here we simulate "Entering" the focused mode
         if (images.length > 0) {
            setMode('zoomed');
            // Randomly pick one or the next one
            setFocusedImage(Math.floor(Math.random() * images.length));
         }
      }
    };

    setupMediaPipe();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
      cancelAnimationFrame(animationFrameId);
    };
  }, [setHandPosition, setGesture, setMode, setFocusedImage, images]);

  return (
    <video 
      ref={videoRef} 
      autoPlay 
      playsInline 
      className="fixed bottom-4 left-4 w-32 h-24 object-cover rounded-lg border-2 border-green-800 opacity-50 z-50 transform scale-x-[-1]" 
    />
  );
};
