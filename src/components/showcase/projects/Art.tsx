import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';

export interface ArtProjectsProps { }

// Automatically load all images placed in src/assets/pictures/projects/photos/
const loadPhotos = (): { src: string; name: string }[] => {
    try {
        // @ts-ignore
        const context = require.context(
            '../../../assets/pictures/projects/photos',
            false,
            /\.(png|jpe?g|gif|webp)$/i
        );
        return context.keys().map((key: string) => {
            const mod = context(key);
            const src = typeof mod === 'string' ? mod : mod.default;
            const fileName = key.replace('./', '').replace(/\.[^/.]+$/, '');
            return { src, name: fileName };
        });
    } catch {
        return [];
    }
};

const ArtProjects: React.FC<ArtProjectsProps> = (props) => {
    const photos = loadPhotos();
    const count = photos.length;
    // Continuous step counter (can go ..., -2, -1, 0, 1, 2, ... for infinite circular rotation)
    const [step, setStep] = useState<number>(0);
    const wheelCooldown = useRef<number>(0);
    const dragStartY = useRef<number | null>(null);

    const rotateWheel = useCallback((delta: number) => {
        setStep((prev) => prev + delta);
    }, []);

    const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
        const now = Date.now();
        if (now - wheelCooldown.current < 220) return;
        if (Math.abs(e.deltaY) < 10) return;
        wheelCooldown.current = now;
        rotateWheel(e.deltaY > 0 ? 1 : -1);
    };

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        dragStartY.current = e.clientY;
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        if (dragStartY.current === null) return;
        const diff = dragStartY.current - e.clientY;
        if (Math.abs(diff) > 30) {
            rotateWheel(diff > 0 ? 1 : -1);
        }
        dragStartY.current = null;
    };

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowDown') rotateWheel(1);
            if (e.key === 'ArrowUp') rotateWheel(-1);
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [rotateWheel]);

    if (count === 0) {
        return <div className="site-page-content" />;
    }

    const radiusY = 240;
    const anglePerItem = 360 / count;

    return (
        <div
            className="site-page-content"
            style={styles.pageContainer}
            onWheel={handleWheel}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
        >
            <div style={styles.wheelStage}>
                {photos.map((photo, index) => {
                    // Shortest angular distance in degrees [-180, 180]
                    const rawAngle = (index - step) * anglePerItem;
                    const normalizedAngle =
                        ((((rawAngle + 180) % 360) + 360) % 360) - 180;
                    const rad = (normalizedAngle * Math.PI) / 180;

                    // Circular position: y along vertical circle, depth factor cos(rad) in [-1, 1]
                    const y = Math.sin(rad) * radiusY;
                    const depth = (Math.cos(rad) + 1) / 2; // 1 at front, 0 at back
                    const scale = 0.62 + 0.38 * depth;
                    const opacity = 0.2 + 0.8 * Math.pow(depth, 1.3);
                    const rotateX = -Math.sin(rad) * 28;
                    const zIndex = Math.round(depth * 100);
                    const isActive = Math.abs(normalizedAngle) < anglePerItem / 2;

                    const handleCardClick = () => {
                        if (isActive) return;
                        // Rotate in the shortest direction to bring clicked card to front
                        const stepsToMove = Math.round(
                            normalizedAngle / anglePerItem
                        );
                        rotateWheel(stepsToMove);
                    };

                    return (
                        <motion.div
                            key={photo.name + index}
                            onClick={handleCardClick}
                            animate={{
                                y,
                                scale,
                                opacity,
                                rotateX,
                            }}
                            transition={{
                                type: 'spring',
                                stiffness: 170,
                                damping: 22,
                                mass: 0.9,
                            }}
                            style={{
                                ...styles.wheelCard,
                                zIndex,
                                cursor: isActive ? 'default' : 'pointer',
                            }}
                        >
                            <div style={styles.imageFrame}>
                                <img
                                    src={photo.src}
                                    alt={photo.name}
                                    style={styles.image}
                                    draggable={false}
                                />
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

const styles: StyleSheetCSS = {
    pageContainer: {
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        height: '100%',
        marginLeft: 250,
        padding: '8px 24px',
        userSelect: 'none',
    },
    wheelStage: {
        position: 'relative',
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        perspective: 1400,
    },
    wheelCard: {
        position: 'absolute',
        width: '92%',
        maxWidth: 980,
        justifyContent: 'center',
        alignItems: 'center',
        transformStyle: 'preserve-3d',
    },
    imageFrame: {
        width: '100%',
        padding: 12,
        backgroundColor: '#ffffff',
        boxShadow:
            'inset -1px -1px #2b2b2b, inset 1px 1px #ffffff, inset -2px -2px #808080, inset 2px 2px #c0c0c0, 0 16px 36px rgba(0, 0, 0, 0.3)',
        boxSizing: 'border-box',
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: '100%',
        maxHeight: '68vh',
        objectFit: 'contain',
        display: 'block',
    },
};

export default ArtProjects;
