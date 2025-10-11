// ...existing code up to the first export default DashboardParent;
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboardData } from '../../../shared/useDashboard';
import { useParentDashboard } from '../hooks/useParent';
import { useNotifications } from '../../../shared/hooks/useNotifications';
import NotificationIcon from '../../../shared/components/NotificationIcon';
import NotificationDropdown from '../../../shared/components/NotificationDropdown';
import '../initializeParentData'; // Initialize sample data
import '../styles/DashboardParent.css';

function DashboardParent() {
	const [data, setData] = useState(null);
	const navigate = useNavigate();
	const dashboardData = useDashboardData();
	const { notifications } = useNotifications();
	const { parentData } = useParentDashboard();

	useEffect(() => {
		// Fetch and set data
		setData(dashboardData);
	}, [dashboardData]);

	return (
		<div className="dashboard-parent">
			<NotificationIcon notifications={notifications} />
			<NotificationDropdown notifications={notifications} />
			{/* Render parent data */}
			<h1>Welcome to the Parent Dashboard</h1>
			{/* Additional rendering logic */}
		</div>
	);
}

export default DashboardParent;
