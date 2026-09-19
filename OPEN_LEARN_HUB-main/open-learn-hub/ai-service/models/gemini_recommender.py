import os
import google.generativeai as genai

class GeminiRecommender:
    def __init__(self):
        self.api_key = os.getenv('GEMINI_API_KEY')
        self.enabled = bool(self.api_key)
        
        if self.enabled:
            try:
                genai.configure(api_key=self.api_key)
                # Use gemini-1.5-flash which is available in the current API
                self.model = genai.GenerativeModel('gemini-1.5-flash')
                print("✅ Gemini API initialized successfully")
            except Exception as e:
                print(f"❌ Failed to initialize Gemini: {e}")
                self.enabled = False

    def test_connection(self):
        if not self.enabled:
            return False, "Gemini API key not configured"
        try:
            # Test with a simple prompt
            response = self.model.generate_content("Say 'OK' if you can read this.")
            return True, "Connection successful"
        except Exception as e:
            return False, str(e)

    def get_recommendations(self, enrolled_courses, available_courses, top_k=3):
        if not self.enabled or not available_courses:
            return ["Introduction to Programming", "Data Structures", "Web Development"][:top_k]
        
        try:
            enrolled_str = ", ".join([c.get('title', str(c)) for c in enrolled_courses]) if enrolled_courses else "None"
            available_str = ", ".join([c.get('title', str(c)) for c in available_courses])
            
            prompt = f"""Based on these enrolled courses: {enrolled_str}
Recommend {top_k} courses from this list: {available_str}
Return ONLY the course titles as a comma-separated list, nothing else."""
            
            response = self.model.generate_content(prompt)
            recommendations = [r.strip() for r in response.text.split(',')]
            return recommendations[:top_k]
        except Exception as e:
            print(f"Recommendation error: {e}")
            return available_courses[:top_k] if available_courses else []

    def _call_with_retry(self, prompt, max_retries=3):
        """Call Gemini API with retry logic"""
        if not self.enabled:
            return None, Exception("Gemini not enabled")
        
        for attempt in range(max_retries):
            try:
                response = self.model.generate_content(prompt)
                return response, None
            except Exception as e:
                if attempt == max_retries - 1:
                    return None, e
                print(f"Retry {attempt + 1}/{max_retries} after error: {e}")
        
        return None, Exception("Max retries exceeded")
