import { createClient } from "@supabase/supabase-js";

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
const supabaseKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

let supabaseClient: any;

if (!supabaseUrl || !supabaseKey) {
	// Avoid throwing during client initialization; provide a stub that errors when used.
	// This prevents an uncaught exception which would blank the app.
	console.warn("VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not set. Supabase client will be a stub.");
	const stub: any = {
		auth: {
			signInWithPassword: async () => {
				throw new Error("Supabase not initialized: missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY");
			},
		},
		from: () => {
			throw new Error("Supabase not initialized: missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY");
		},
		rpc: async () => {
			throw new Error("Supabase not initialized: missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY");
		},
	};
	supabaseClient = stub;
} else {
	supabaseClient = createClient(supabaseUrl, supabaseKey);
}

export const supabase = supabaseClient;
