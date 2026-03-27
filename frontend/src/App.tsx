import { Package } from "lucide-react";
import { Toaster } from "sonner";
import { OrdersTable } from "./components/orders-table";

export default function App() {
	return (
		<div className="min-h-screen">
			<header className="border-b border-gray-200/80 bg-white/90 backdrop-blur">
				<div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-4 sm:px-6">
					<div className="flex size-8 items-center justify-center rounded-lg bg-gray-900">
						<Package className="size-5 text-white" />
					</div>
					<div>
						<h1 className="text-xl font-semibold text-gray-900">
							Walter Tech Assessment
						</h1>
						<p className="text-xs text-gray-500">
							Real-time order tracking and management
						</p>
					</div>
				</div>
			</header>

			<main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
				<OrdersTable />
			</main>

			<Toaster position="top-right" richColors />
		</div>
	);
}
