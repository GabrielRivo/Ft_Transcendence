// Point d'entrée principal du mini-framework React-like
export { createElement, createComponent, Fragment, FragmentComponent } from './core/component';
export { render } from './core/render';
export { useState, useEffect, useContext, createContext } from './core/hooks/index';

// Import workLoop pour initialiser la boucle
import './core/fiber/workLoop';

// API publique consolidée
import { createElement, createComponent, Fragment, FragmentComponent } from './core/component';
import { render } from './core/render';
import { useState, useEffect, useContext, createContext } from './core/hooks/index';

const MiniReact = {
  createElement,
  createComponent,
  Fragment,
  FragmentComponent,
  render,
  useState,
  useEffect,
  useContext,
  createContext,
};

export default MiniReact; 