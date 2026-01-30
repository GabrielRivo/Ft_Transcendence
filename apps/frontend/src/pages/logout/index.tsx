import { useEffect } from 'my-react';
import { useAuth } from '../../hook/useAuth';
import { useNavigate } from 'my-react-router';
import { useToast } from '../../hook/useToast';

export function LogoutPage() {
	const { logout } = useAuth();
	const navigate = useNavigate();
	const { toast } = useToast();

	const handleLogout = () => {
		logout().then(() => {
			toast('Déconnexion réussie', 'success', 1000);
			navigate('/');
		});
	};

    useEffect(() => {
        handleLogout();
    });

	return null;
}