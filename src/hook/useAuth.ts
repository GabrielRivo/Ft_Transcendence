import { useContext } from 'my-react';
import { AuthContext, AuthContextType } from '../context/authContext';

export function useAuth(): AuthContextType {
	const context = useContext(AuthContext);

	if (!context) {
		throw new Error('useAuth must be used within an AuthProvider');
	}

	return context as AuthContextType;
}

