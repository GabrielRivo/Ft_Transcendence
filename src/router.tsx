import { createElement } from 'my-react';
import { Router } from 'my-react-router';

import { Home } from './pages/home';

import { NotFoundPage } from './pages/errors/notFoundPage';
import { MainLayout } from './layout/mainLayout';
// import { Game } from './pages/game';
import { LoginLayout } from './layout/loginLayout';
import { Login } from './pages/login';
import { Register } from './pages/register';

const routes = [
	{
		layout: MainLayout,
		routes: [
			{
				path: '/',
				component: Home,
			},
			// {
			// 	path: '/game',
			// 	component: Game,
			// },
		],
	},
	{
		layout: LoginLayout,
		routes: [
			{
				path: '/login',
				component: Login,
			},
			{
				path: '/register',
				component: Register,
			},
		],
	},
];

export default function App() {
	return <Router groups={routes} NoFound={<NotFoundPage />} />;
}
