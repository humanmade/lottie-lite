// Enqueue GSAP and ScrollTrigger for Lottie scroll interaction
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);

export { gsap, ScrollTrigger };
