// supabase.js

import { createClient } from "@supabase/supabase-js";

const supabaseKey = process.env.SUPABASE_ANNON_KEY;
const supabaseUrl = process.env.SUPABASE_URL;

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
