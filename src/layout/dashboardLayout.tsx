import { createElement, useRef } from 'my-react';

function Info() {
	return (
		// <div className="flex h-12 w-full shrink-0 items-center justify-between border-b border-cyan-500/30 bg-slate-900/90 px-6 font-mono text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.1)]">
		// 	<div className="flex items-center gap-2">
		// 		<div className="h-2 w-2 animate-pulse rounded-full bg-cyan-400"></div>
		// 		<span className="tracking-widest">SYSTEM_OVERRIDE // V.2.0</span>
		// 	</div>
		// 	<div className="text-xs opacity-70">NET_SPEED: 12TB/s</div>
		// </div>
		<div className="flex h-12 w-full shrink-0 items-center justify-center"></div>
	);
}

function Menu() {
	// border-t border-red-500/30 bg-slate-900/90 font-mono text-xs text-red-400
	return (
		<div className="flex h-10 w-full shrink-0 items-center justify-center">{/* ⚠ WARNING: UNSECURED CONNECTION */}</div>
	);
}

function Chat() {
	const scrollRef = useRef<HTMLDivElement | null>(null);

	const handleWheel = (e: WheelEvent) => {
		if (scrollRef.current) {
			scrollRef.current.scrollTop += e.deltaY;
		}
	};

	const logs = Array(50)
		.fill(null)
		.map((_, i) => ({
			id: i,
			time: `10:${(i % 60).toString().padStart(2, '0')}`,
			msg: i % 2 === 0 ? 'Hello World' : 'Salut!!!',
			user: i % 2 === 0 ? 'Micheal' : 'Jean',
		}));

	return (
		<div className="ff-dashboard-chat-safe grid h-full w-full origin-left -rotate-y-12 grid-cols-6 gap-4 p-4 transform-3d">
			<div className="ff-dashboard-panel-enter ff-dashboard-panel-enter--delay-2 col-span-1 h-full min-h-0">
				<div className="group h-full min-h-0 rounded-xl border border-cyan-500/40 bg-slate-950/60 p-4 shadow-[0_0_20px_rgba(6,182,212,0.15),inset_0_0_20px_rgba(6,182,212,0.05)] backdrop-blur-md transition-all duration-300 hover:-translate-y-2 hover:border-cyan-400 hover:shadow-[0_0_30px_rgba(6,182,212,0.4)]">
					<div className="mb-3 border-b border-cyan-500/20 pb-1 text-sm font-bold tracking-widest text-cyan-500">
						STATUS
					</div>
					<div className="flex flex-col gap-2 space-y-2 font-mono text-xs text-cyan-300">
						{/* Faire component */}
						<div className="flex cursor-pointer flex-col items-center gap-2 hover:text-cyan-500">
							<div className="relative">
								<img
									src="https://cdn.omlet.com/images/originals/breed_abyssinian_cat.jpg"
									alt="cat"
									className="h-16 w-16 rounded-full object-cover"
								/>
								<div className="absolute right-0 bottom-0 h-3 w-3 rounded-full bg-green-500"></div>
							</div>
							<span className="font-bold">Michel</span>
						</div>
						{/* Faire component - end*/}
						{/* Faire component */}
						<div className="flex cursor-pointer flex-col items-center gap-2 hover:text-cyan-500">
							<div className="relative">
								<img
									src="https://cdn.omlet.com/images/originals/breed_abyssinian_cat.jpg"
									alt="cat"
									className="h-16 w-16 rounded-full object-cover"
								/>
								<div className="absolute right-0 bottom-0 h-3 w-3 rounded-full bg-green-500"></div>
							</div>
							<span className="font-bold">Michel</span>
						</div>
						{/* Faire component - end*/}
						{/* Faire component */}
						<div className="flex cursor-pointer flex-col items-center gap-2 hover:text-cyan-500">
							<div className="relative">
								<img
									src="https://cdn.omlet.com/images/originals/breed_abyssinian_cat.jpg"
									alt="cat"
									className="h-16 w-16 rounded-full object-cover"
								/>
								<div className="absolute right-0 bottom-0 h-3 w-3 rounded-full bg-green-500"></div>
							</div>
							<span className="font-bold">Michel</span>
						</div>
						{/* Faire component - end*/}
						{/* Faire component */}
						<div className="flex cursor-pointer flex-col items-center gap-2 hover:text-cyan-500">
							<div className="relative">
								<img
									src="https://cdn.omlet.com/images/originals/breed_abyssinian_cat.jpg"
									alt="cat"
									className="h-16 w-16 rounded-full object-cover"
								/>
								<div className="absolute right-0 bottom-0 h-3 w-3 rounded-full bg-green-500"></div>
							</div>
							<span className="font-bold">Michel</span>
						</div>
						{/* Faire component - end*/}
						{/* Faire component */}
						<div className="flex cursor-pointer flex-col items-center gap-2 hover:text-cyan-500">
							<div className="relative">
								<img
									src="https://cdn.omlet.com/images/originals/breed_abyssinian_cat.jpg"
									alt="cat"
									className="h-16 w-16 rounded-full object-cover"
								/>
								<div className="absolute right-0 bottom-0 h-3 w-3 rounded-full bg-green-500"></div>
							</div>
							<span className="font-bold">Michel</span>
						</div>
						{/* Faire component - end*/}
						{/* Faire component */}
						<div className="flex cursor-pointer flex-col items-center gap-2 hover:text-cyan-500">
							<div className="relative">
								<img
									src="https://cdn.omlet.com/images/originals/breed_abyssinian_cat.jpg"
									alt="cat"
									className="h-16 w-16 rounded-full object-cover"
								/>
								<div className="absolute right-0 bottom-0 h-3 w-3 rounded-full bg-green-500"></div>
							</div>
							<span className="font-bold">Michel</span>
						</div>
						{/* Faire component - end*/}
					</div>
				</div>
			</div>

			<div className="ff-dashboard-panel-enter ff-dashboard-panel-enter--delay-1 col-span-4 h-full min-h-0">
				<div
					onWheel={handleWheel}
					className="group flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-purple-500/40 bg-slate-950/60 shadow-[0_0_20px_rgba(168,85,247,0.15),inset_0_0_20px_rgba(168,85,247,0.05)] backdrop-blur-md transition-all duration-300 hover:-translate-y-2 hover:border-purple-400 hover:shadow-[0_0_30px_rgba(168,85,247,0.4)]"
				>
					<div className="flex shrink-0 justify-between border-b border-purple-500/20 bg-purple-500/10 p-4 text-sm font-bold tracking-widest text-purple-500">
						<span>{`CHAT > HUB`}</span>
						<span className="animate-pulse">● LIVE</span>
					</div>

					<div
						ref={scrollRef}
						className="min-h-0 flex-1 overflow-y-auto p-2 font-mono text-xs text-purple-300 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-purple-500/50 hover:[&::-webkit-scrollbar-thumb]:bg-purple-400 [&::-webkit-scrollbar-track]:bg-slate-800/30"
					>
						<div className="flex flex-col gap-1">
							{logs.map((log) => (
								<div
									key={log.id}
									className="flex cursor-pointer flex-col gap-1 rounded border-b border-purple-500/10 px-1 py-1 transition-colors hover:bg-purple-500/20 hover:text-white"
								>
									<div className="flex gap-2">
										<span className="opacity-50 select-none">[{log.time}]</span>
										<span>
											<span className="font-bold">{log.user}</span>
											{` >_`}
										</span>
									</div>
									<p>{log.msg}</p>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>

			<div className="ff-dashboard-panel-enter ff-dashboard-panel-enter--delay-0 col-span-1 h-full min-h-0">
				<div className="group h-full min-h-0 rounded-xl border border-orange-500/40 bg-slate-950/60 p-4 shadow-[0_0_20px_rgba(249,115,22,0.15),inset_0_0_20px_rgba(249,115,22,0.05)] backdrop-blur-md transition-all duration-300 hover:-translate-y-2 hover:border-orange-400 hover:shadow-[0_0_30px_rgba(249,115,22,0.4)]">
					<div className="mb-3 border-b border-orange-500/20 pb-1 text-right text-sm font-bold tracking-widest text-orange-500">
						TARGET
					</div>
					<div className="flex flex-col gap-2 text-xs">
						{/* Faire component */}
						<div className="flex cursor-pointer flex-col items-center gap-2 hover:text-orange-500">
							<div className="relative">
								<img
									src="https://cdn.omlet.com/images/originals/breed_abyssinian_cat.jpg"
									alt="cat"
									className="h-16 w-16 rounded-full object-cover"
								/>
							</div>
							<span className="font-bold">Michel</span>
						</div>
						{/* Faire component - end*/}
						{/* Faire component */}
						<div className="flex cursor-pointer flex-col items-center gap-2 hover:text-orange-500">
							<div className="relative">
								<img
									src="https://cdn.omlet.com/images/originals/breed_abyssinian_cat.jpg"
									alt="cat"
									className="h-16 w-16 rounded-full object-cover"
								/>
							</div>
							<span className="font-bold">Michel</span>
						</div>
						{/* Faire component - end*/}
						{/* Faire component */}
						<div className="flex cursor-pointer flex-col items-center gap-2 hover:text-orange-500">
							<div className="relative">
								<img
									src="https://cdn.omlet.com/images/originals/breed_abyssinian_cat.jpg"
									alt="cat"
									className="h-16 w-16 rounded-full object-cover"
								/>
							</div>
							<span className="font-bold">Michel</span>
						</div>
						{/* Faire component - end*/}
						{/* Faire component */}
						<div className="flex cursor-pointer flex-col items-center gap-2 hover:text-orange-500">
							<div className="relative">
								<img
									src="https://cdn.omlet.com/images/originals/breed_abyssinian_cat.jpg"
									alt="cat"
									className="h-16 w-16 rounded-full object-cover"
								/>
							</div>
							<span className="font-bold">Michel</span>
						</div>
						{/* Faire component - end*/}
						{/* Faire component */}
						<div className="flex cursor-pointer flex-col items-center gap-2 hover:text-orange-500">
							<div className="relative">
								<img
									src="https://cdn.omlet.com/images/originals/breed_abyssinian_cat.jpg"
									alt="cat"
									className="h-16 w-16 rounded-full object-cover"
								/>
							</div>
							<span className="font-bold">Michel</span>
						</div>
						{/* Faire component - end*/}
						{/* Faire component */}
						<div className="flex cursor-pointer flex-col items-center gap-2 hover:text-orange-500">
							<div className="relative">
								<img
									src="https://cdn.omlet.com/images/originals/breed_abyssinian_cat.jpg"
									alt="cat"
									className="h-16 w-16 rounded-full object-cover"
								/>
							</div>
							<span className="font-bold">Michel</span>
						</div>
						{/* Faire component - end*/}
					</div>
				</div>
			</div>
		</div>
	);
}

export function DashboardLayout({ children }: { children: Element }) {
	return (
		<div className="flex h-full w-full flex-col overflow-hidden text-white selection:bg-cyan-500/30">
			<Info />
			<div className="flex min-h-0 w-full flex-1 overflow-hidden p-8">
				<div className="grid h-full w-full grid-cols-1 gap-6 md:grid-cols-12">
					<div className="h-full min-h-0 overflow-hidden md:col-span-7">
						<div className="h-full w-full overflow-y-auto">{children}</div>
					</div>

					<div className="ff-dashboard-perspective flex h-full min-h-0 items-center justify-center perspective-[2000px] md:col-span-5">
						<Chat />
					</div>
				</div>
			</div>

			<Menu />
		</div>
	);
}
