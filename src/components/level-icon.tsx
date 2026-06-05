
"use client";

import React from 'react';
import Image from 'next/image';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LevelIconProps {
  levelName: string;
  className?: string;
}

// This map uses simple, lowercase keywords for reliable matching.
const levelToImageMap: { [key: string]: string } = {
  'starfish': 'Starfish.png',
  'octopus': 'Octopus.png',
  'sea turtle': 'Sea_Turtle.png',
  'seahorse': 'Seahorse.png',
  'penguin': 'Penguin.png',
  'sea lion': 'Sea_Lion.png',
  'jellyfish': 'Jellyfish.png',
  'platypus': 'Platypus.png',
  'seal': 'Seal.png',
  'marlin': 'Marlin.png',
  'shark': 'Shark.png',
  'orca': 'Orca.png',
  'goswim academy 1': 'level_13.png',
  'goswim academy 2': 'level_14.png',
};

export const LevelIcon = ({ levelName, className = 'h-5 w-5' }: LevelIconProps) => {
  if (!levelName) {
    return <Sparkles className={cn(className, 'text-gray-400')} />;
  }
  
  const normalizedLevelName = levelName.toLowerCase();
  let imageName: string | undefined;

  // Find the correct image by checking if the level name includes the keyword.
  for (const keyword in levelToImageMap) {
    if (normalizedLevelName.includes(keyword)) {
      imageName = levelToImageMap[keyword];
      break;
    }
  }

  if (imageName) {
    const iconSrc = `/icons/${imageName}`;
    // Extract width and height from className if possible, otherwise default
    const sizeMatch = className.match(/w-(\d+)/) ?? className.match(/h-(\d+)/) ?? className.match(/size-(\d+)/);
    // Tailwind units are 1/4 rem, so size * 4 gives an approximation in pixels.
    const size = sizeMatch ? parseInt(sizeMatch[1], 10) * 4 : 20;

    return (
      <Image
        src={iconSrc}
        alt={`${levelName} icon`}
        width={size}
        height={size}
        className={cn("object-contain", className)}
        unoptimized // Use this to bypass optimization for static public assets.
      />
    );
  }

  // Fallback to a default icon if no match is found
  return <Sparkles className={cn(className, 'text-gray-400')} />;
};
