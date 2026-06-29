import React, { useEffect, useRef, Suspense } from 'react';
import { useAuthContext } from '../context/AuthContext';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import { Satellite, ShieldAlert } from 'lucide-react';

// Earth Textures (Using stable three.js example textures)
const earthMapUrl = 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg';
const cloudsMapUrl = 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_clouds_1024.png';
const nightMapUrl = 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg'; // fallback
const specularMapUrl = 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_specular_2048.jpg';

const Earth = () => {
    const groupRef = useRef();
    const earthRef = useRef();
    const cloudsRef = useRef();

    const [colorMap, cloudsMap, nightMap, specMap] = useLoader(THREE.TextureLoader, [
        earthMapUrl, cloudsMapUrl, nightMapUrl, specularMapUrl
    ], (loader) => {
        loader.setCrossOrigin('anonymous');
    });

    // Optimize textures
    colorMap.colorSpace = THREE.SRGBColorSpace;
    colorMap.anisotropy = 16;

    useFrame(({ clock, pointer }) => {
        const t = clock.getElapsedTime();
        
        // Spin the earth and clouds
        earthRef.current.rotation.y = t * 0.05;
        cloudsRef.current.rotation.y = t * 0.06;

        // Interactive depth on mouse hover
        // Lerp rotation towards mouse pointer to keep it smooth
        groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, (pointer.y * Math.PI) / 8, 0.05);
        groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, (pointer.x * Math.PI) / 8, 0.05);
    });

    return (
        <group ref={groupRef}>
            {/* The Earth */}
            <mesh ref={earthRef}>
                <sphereGeometry args={[2.5, 64, 64]} />
                <meshPhongMaterial
                    map={colorMap}
                    specularMap={specMap}
                    specular={new THREE.Color('grey')}
                    emissiveMap={nightMap}
                    emissive={new THREE.Color(0xffffff)}
                    emissiveIntensity={0.6}
                    shininess={30}
                />
            </mesh>

            {/* Cloud Layer */}
            <mesh ref={cloudsRef}>
                <sphereGeometry args={[2.53, 64, 64]} />
                <meshPhongMaterial
                    map={cloudsMap}
                    transparent={true}
                    opacity={0.7}
                    blending={THREE.AdditiveBlending}
                    side={THREE.DoubleSide}
                    depthWrite={false}
                />
            </mesh>

            {/* Cyan Atmospheric Fresnel Glow */}
            <mesh>
                <sphereGeometry args={[2.65, 64, 64]} />
                <meshBasicMaterial
                    color="#22D3EE"
                    transparent
                    opacity={0.12}
                    side={THREE.BackSide}
                    blending={THREE.AdditiveBlending}
                />
            </mesh>
        </group>
    );
};

export default function Landing() {
    const { loginWithGoogle, user } = useAuthContext();

    useEffect(() => {
        if (window.google) {
            // HOW TO SET UP REAL GOOGLE LOGIN:
            // 1. Go to Google Cloud Console -> APIs & Services -> Credentials
            // 2. Create an OAuth 2.0 Client ID for Web Applications
            // 3. Add 'http://localhost:5173' to Authorized JavaScript origins
            // 4. Copy the Client ID and replace the dummy string below
            window.google.accounts.id.initialize({
                client_id: "656796658435-9pn8qg5d8h55dkjtnvr0q3il1tu99u39.apps.googleusercontent.com",
                callback: loginWithGoogle
            });
            window.google.accounts.id.renderButton(
                document.getElementById('google-btn'),
                { theme: "filled_blue", size: "large", shape: "pill", width: 300 }
            );
        }
    }, [loginWithGoogle]);

    if (user) return null;

    return (
        <div className="relative w-screen h-screen overflow-hidden bg-[#030614] text-white font-['Space_Grotesk']">
            
            {/* 3D Background */}
            <div className="absolute inset-0 z-0">
                <Canvas camera={{ position: [0, 0, 7], fov: 45 }}>
                    <ambientLight intensity={0.1} />
                    <directionalLight position={[5, 3, 5]} intensity={2.5} />
                    <Suspense fallback={null}>
                        <Earth />
                    </Suspense>
                    <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={0.5} />
                </Canvas>
            </div>

            {/* Navigation Overlay */}
            <header className="absolute top-0 left-0 right-0 z-20 flex justify-between items-center px-8 md:px-12 py-6">
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                    className="flex items-center gap-3"
                >
                    <Satellite className="text-[#22D3EE]" size={28} />
                    <span className="font-extrabold text-xl tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-[#22D3EE] to-[#A855F7]">
                        GEO-ALERT
                    </span>
                </motion.div>
                <motion.button 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7, duration: 0.8 }}
                    className="text-sm font-semibold tracking-wider text-gray-300 hover:text-[#22D3EE] hover:drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] transition-all uppercase"
                >
                    Admin Panel
                </motion.button>
            </header>

            {/* UI Overlay */}
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-4">
                
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1, duration: 0.6, ease: "easeOut" }}
                    className="backdrop-blur-md bg-white/5 border border-white/10 rounded-3xl p-10 md:p-14 w-full max-w-xl text-center shadow-[0_0_80px_rgba(34,211,238,0.08)] relative"
                >
                    {/* Glowing Accent */}
                    <div className="absolute -top-10 -left-10 w-32 h-32 bg-[#22D3EE] rounded-full blur-[100px] opacity-20 pointer-events-none" />
                    <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-[#A855F7] rounded-full blur-[100px] opacity-20 pointer-events-none" />

                    <div className="flex justify-center mb-6">
                        <motion.div
                            animate={{ y: [0, -10, 0] }}
                            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                        >
                            <ShieldAlert size={56} className="text-[#22D3EE]" strokeWidth={1.5} />
                        </motion.div>
                    </div>
                    
                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4 font-['Space_Grotesk'] leading-tight">
                        <span className="block text-white drop-shadow-md">Monitor Earth</span>
                        <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#22D3EE] to-[#A855F7] mt-1 drop-shadow-sm pb-2">
                            From Above
                        </span>
                    </h1>

                    <p className="text-gray-300 text-lg md:text-xl font-light leading-relaxed mb-10 mx-auto font-sans">
                        Advanced satellite change detection powered by Sentinel-2 imagery and AI. 
                        Track environmental shifts in real-time.
                    </p>

                    <div className="flex flex-col gap-4 w-full max-w-sm mx-auto items-center">
                        <div id="google-btn" className="flex justify-center w-full min-h-[44px]"></div>
                        
                        <div className="w-full flex items-center justify-center gap-4 my-2 opacity-50">
                            <div className="h-px bg-white flex-1" />
                            <span className="text-xs uppercase tracking-widest text-white">OR</span>
                            <div className="h-px bg-white flex-1" />
                        </div>

                        <button
                            onClick={() => loginWithGoogle({ 
                                credential: 'mock.' + btoa(JSON.stringify({ 
                                    name: 'Space Explorer', 
                                    email: 'admin@geo-alert.space',
                                    sub: '1'
                                })) + '.token' 
                            })}
                            className="group relative w-full overflow-hidden rounded-full font-bold py-4 px-8 border border-[#22D3EE] text-[#22D3EE] hover:bg-[#22D3EE]/10 hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] transition-all duration-300 font-sans tracking-wide"
                        >
                            <span className="relative z-10 text-sm">DEMO LOGIN (SKIP AUTH)</span>
                        </button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
