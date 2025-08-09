// Test script to verify Interview Insights database columns
import { supabase } from './SupabaseClient.js';

async function testInterviewInsights() {
    console.log('🧪 Testing Interview Insights Database Columns...');

    try {
        // Get the first applying record to test with
        const { data: testRecord, error: fetchError } = await supabase
            .from('applying')
            .select('applying_id, job_title_clicked')
            .limit(1)
            .single();

        if (fetchError || !testRecord) {
            console.log('❌ No test record found:', fetchError);
            return;
        }

        console.log('📝 Testing with record:', testRecord.applying_id, testRecord.job_title_clicked);

        // Test updating Interview Insights fields
        const testData = {
            follow_up_date: '2025-01-20',
            interview_went_well: 'Great chemistry with team',
            interview_can_improve: 'Be more confident about pricing',
            offer_rate_alignment: 'Too low compared to market rate',
            prediction_accuracy: 'I was correct about the requirements',
            sent_thank_you_note: true,
            rejection_reason_mentioned: 'They went with internal candidate',
            why_got_interview: 'Strong portfolio and relevant experience'
        };

        const { error: updateError } = await supabase
            .from('applying')
            .update(testData)
            .eq('applying_id', testRecord.applying_id);

        if (updateError) {
            console.log('❌ Update failed:', updateError);
            return;
        }

        console.log('✅ Successfully updated Interview Insights fields!');

        // Verify the data was saved
        const { data: verifyData, error: verifyError } = await supabase
            .from('applying')
            .select('follow_up_date, interview_went_well, interview_can_improve, offer_rate_alignment, prediction_accuracy, sent_thank_you_note, rejection_reason_mentioned, why_got_interview')
            .eq('applying_id', testRecord.applying_id)
            .single();

        if (verifyError) {
            console.log('❌ Verification failed:', verifyError);
            return;
        }

        console.log('📊 Verified data:', verifyData);
        console.log('🎉 All Interview Insights fields are working correctly!');

    } catch (err) {
        console.error('💥 Test failed:', err);
    }
}

// Run the test
testInterviewInsights(); 