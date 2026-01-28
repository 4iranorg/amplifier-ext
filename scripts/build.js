#!/usr/bin/env node
/**
 * Build script for Iran Amplifier extension
 * Bundles JS files with esbuild and copies static assets to dist/
 */

import * as esbuild from 'esbuild';
import { copyFileSync, cpSync, mkdirSync, rmSync } from 'fs';
import { dirname } from 'path';

const isWatch = process.argv.includes('--watch');
const isDev = process.argv.includes('--dev');

// Entry points to bundle
const entryPoints = [
  'src/background/service-worker.js',
  'src/content/content.js',
  'src/popup/popup.js',
  'src/dashboard/dashboard.js',
  'src/onboarding/onboarding.js',
];

// Static files to copy (preserving structure)
const staticFiles = [
  'manifest.json',
  'src/popup/popup.html',
  'src/dashboard/dashboard.html',
  'src/onboarding/onboarding.html',
  'src/content/content.css',
  'src/popup/popup.css',
  'src/dashboard/dashboard.css',
  'src/onboarding/onboarding.css',
];

// Directories to copy entirely
const staticDirs = ['icons'];

// Clean dist directory
console.log('Cleaning dist/...');
rmSync('dist', { recursive: true, force: true });

// Create dist directory structure
console.log('Creating dist/ structure...');
const dirs = [
  'dist',
  'dist/src/background',
  'dist/src/content',
  'dist/src/popup',
  'dist/src/dashboard',
  'dist/src/onboarding',
  'dist/icons',
];
dirs.forEach((dir) => mkdirSync(dir, { recursive: true }));

// Copy static files
console.log('Copying static files...');
staticFiles.forEach((file) => {
  const dest = `dist/${file}`;
  mkdirSync(dirname(dest), { recursive: true });
  copyFileSync(file, dest);
});

// Copy static directories
staticDirs.forEach((dir) => {
  cpSync(dir, `dist/${dir}`, { recursive: true });
});

// Build configuration
const buildOptions = {
  entryPoints,
  bundle: true,
  outdir: 'dist',
  format: 'esm',
  platform: 'browser',
  target: ['firefox128'],
  minify: !isDev,
  sourcemap: isDev ? 'inline' : false,
  logLevel: 'info',
  // Keep the same directory structure
  outbase: '.',
  // Define browser global for compatibility
  define: {
    'process.env.NODE_ENV': isDev ? '"development"' : '"production"',
  },
};

async function build() {
  try {
    if (isWatch) {
      console.log('Starting watch mode...');
      const ctx = await esbuild.context(buildOptions);
      await ctx.watch();
      console.log('Watching for changes...');
    } else {
      console.log('Building...');
      await esbuild.build(buildOptions);
      console.log('Build complete!');
    }
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

build();
