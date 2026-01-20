/**
 * Unit tests for build configuration
 * Tests the Vite build setup and package.json scripts
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT_DIR = join(__dirname, '..', '..');

describe('Build Configuration', () => {
  describe('package.json', () => {
    let packageJson;

    beforeAll(() => {
      const content = readFileSync(join(ROOT_DIR, 'package.json'), 'utf8');
      packageJson = JSON.parse(content);
    });

    it('has build script defined', () => {
      expect(packageJson.scripts).toHaveProperty('build');
      expect(packageJson.scripts.build).toBe('vite build');
    });

    it('has dev script defined', () => {
      expect(packageJson.scripts).toHaveProperty('dev');
      expect(packageJson.scripts.dev).toBe('vite');
    });

    it('has preview script defined', () => {
      expect(packageJson.scripts).toHaveProperty('preview');
      expect(packageJson.scripts.preview).toBe('vite preview');
    });

    it('has vite as a dependency', () => {
      expect(packageJson.dependencies).toHaveProperty('vite');
    });

    it('has esbuild as a dependency (for minification)', () => {
      expect(packageJson.dependencies).toHaveProperty('esbuild');
    });

    it('has rollup as a dependency (for bundling)', () => {
      expect(packageJson.dependencies).toHaveProperty('rollup');
    });
  });

  describe('vite.config.js', () => {
    it('exists in project root', () => {
      const configPath = join(ROOT_DIR, 'vite.config.js');
      expect(existsSync(configPath)).toBe(true);
    });

    it('contains build configuration', () => {
      const configContent = readFileSync(join(ROOT_DIR, 'vite.config.js'), 'utf8');
      expect(configContent).toContain('build:');
      expect(configContent).toContain('outDir:');
      expect(configContent).toContain('minify:');
    });

    it('has output directory set to dist', () => {
      const configContent = readFileSync(join(ROOT_DIR, 'vite.config.js'), 'utf8');
      expect(configContent).toContain("outDir: 'dist'");
    });

    it('enables sourcemaps', () => {
      const configContent = readFileSync(join(ROOT_DIR, 'vite.config.js'), 'utf8');
      expect(configContent).toContain('sourcemap: true');
    });

    it('uses esbuild for minification', () => {
      const configContent = readFileSync(join(ROOT_DIR, 'vite.config.js'), 'utf8');
      expect(configContent).toContain("minify: 'esbuild'");
    });
  });

  describe('Entry point', () => {
    it('main.js exists', () => {
      const mainPath = join(ROOT_DIR, 'js', 'main.js');
      expect(existsSync(mainPath)).toBe(true);
    });

    it('main.js imports all core modules', () => {
      const mainContent = readFileSync(join(ROOT_DIR, 'js', 'main.js'), 'utf8');
      expect(mainContent).toContain("import './core/storage.js'");
      expect(mainContent).toContain("import './core/utils.js'");
      expect(mainContent).toContain("import './core/proxy.js'");
    });

    it('main.js imports all service modules', () => {
      const mainContent = readFileSync(join(ROOT_DIR, 'js', 'main.js'), 'utf8');
      expect(mainContent).toContain("import './services/overpass.js'");
      expect(mainContent).toContain("import './services/feeds.js'");
      expect(mainContent).toContain("import './services/api.js'");
    });

    it('main.js imports all map modules', () => {
      const mainContent = readFileSync(join(ROOT_DIR, 'js', 'main.js'), 'utf8');
      expect(mainContent).toContain("import './map/inline-map.js'");
      expect(mainContent).toContain("import './map/globe.js'");
      expect(mainContent).toContain("import './map/view-toggle.js'");
    });

    it('main.js imports all panel modules', () => {
      const mainContent = readFileSync(join(ROOT_DIR, 'js', 'main.js'), 'utf8');
      expect(mainContent).toContain("import './panels/panel-manager.js'");
      expect(mainContent).toContain("import './panels/news.js'");
      expect(mainContent).toContain("import './panels/markets.js'");
    });

    it('modules export global functions for onclick handlers', () => {
      // Global functions are exported by their respective modules, not main.js
      const appContent = readFileSync(join(ROOT_DIR, 'js', 'app.js'), 'utf8');
      expect(appContent).toContain('window.toggleSettings');
      expect(appContent).toContain('window.refreshAll');

      const inlineMapContent = readFileSync(join(ROOT_DIR, 'js', 'map', 'inline-map.js'), 'utf8');
      expect(inlineMapContent).toContain('window.MapModule');

      const viewToggleContent = readFileSync(join(ROOT_DIR, 'js', 'map', 'view-toggle.js'), 'utf8');
      expect(viewToggleContent).toContain('window.toggleMapViewMode');
    });
  });

  describe('.gitignore', () => {
    it('excludes dist directory', () => {
      const gitignoreContent = readFileSync(join(ROOT_DIR, '.gitignore'), 'utf8');
      expect(gitignoreContent).toContain('dist/');
    });

    it('excludes node_modules', () => {
      const gitignoreContent = readFileSync(join(ROOT_DIR, '.gitignore'), 'utf8');
      expect(gitignoreContent).toContain('node_modules/');
    });
  });
});

describe('Module structure', () => {
  describe('JS modules exist', () => {
    const modules = [
      'js/core/storage.js',
      'js/core/utils.js',
      'js/core/proxy.js',
      'js/constants.js',
      'js/services/overpass.js',
      'js/services/feeds.js',
      'js/services/yahoo.js',
      'js/services/api.js',
      'js/map/data-loaders.js',
      'js/map/popups.js',
      'js/map/zoom.js',
      'js/map/globe.js',
      'js/map/inline-map.js',
      'js/map/view-toggle.js',
      'js/panels/panel-manager.js',
      'js/panels/news.js',
      'js/panels/markets.js',
      'js/panels/monitors.js',
      'js/panels/polymarket.js',
      'js/panels/congress.js',
      'js/panels/whales.js',
      'js/panels/misc.js',
      'js/panels/livestream.js',
      'js/panels/pentagon.js',
      'js/app.js'
    ];

    modules.forEach(modulePath => {
      it(`${modulePath} exists`, () => {
        const fullPath = join(ROOT_DIR, modulePath);
        expect(existsSync(fullPath)).toBe(true);
      });
    });
  });
});
