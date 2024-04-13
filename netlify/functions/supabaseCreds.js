const { createClient } = require('@supabase/supabase-js');

exports.handler = async function () {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    const supabase = createClient(supabaseUrl, supabaseKey);

    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
        },
        // body: JSON.stringify({ supabaseUrl, supabaseKey }),
        body: JSON.stringify({ supabase }),
    };
};