import { createElement } from 'my-react';
import { CardStyle1 } from '../components/ui/card/style1';

export function DashboardLayout({ children }: { children: Element }) {
	return <div className="text-white">{children}</div>;
}
