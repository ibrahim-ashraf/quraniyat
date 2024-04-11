// const supabaseKey = process.env.SUPABASE_KEY

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ovonkzsbmfrwtzjmhatb.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92b25renNibWZyd3R6am1oYXRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTI3NjQ2MTIsImV4cCI6MjAyODM0MDYxMn0.eBlzqI4U3byFYss3P0zw4BCREg9YmN678L-NsoXhwqA";
const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;