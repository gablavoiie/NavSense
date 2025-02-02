from flask import Flask, request, jsonify
import vertexai
import requests
from vertexai.language_models import TextGenerationModel
from vertexai.generative_models import GenerativeModel

# Initialize the Vertex AI client
vertexai.init(project="", location="us-central1")

model = GenerativeModel("gemini-1.5-flash-002")

# Google Places API key
google_maps_api_key = ''  # Replace with your actual API key

# Create Flask app
app = Flask(__name__)

# Define a route to handle text summarization and fetch reviews
@app.route('/summarize_and_get_reviews', methods=['POST'])
def summarize_and_get_reviews():
    print('receiveedd')
    # Get the text and place_id from the POST request
    data = request.get_json()
    article_text = data.get('text', '')
    place_id = data.get('place_id', '')

    if not article_text:
        return jsonify({"error": "No text provided"}), 400
    if not place_id:
        return jsonify({"error": "Place ID is required"}), 400

    # Step 1: Summarize the article text using Vertex AI
    summary_response = model.generate_content(
        f"Provide a summary in one sentences for the following google map location:\n{article_text}"
    )
    article_summary = summary_response.text
    print(article_summary)

    # Step 2: Fetch reviews for the place from Google Places API
    url = f"https://maps.googleapis.com/maps/api/place/details/json"
    params = {
        'place_id': place_id,
        'key': google_maps_api_key,
    }

    response = requests.get(url, params=params)  # Use requests.get instead of axios.get
    print(response)
    place_details = response.json()

    # Extract reviews from the response
    reviews = place_details.get('result', {}).get('reviews', [])

    if not reviews:
        return jsonify({"message": "No reviews found for this place."}), 200

    # Extract the review texts
    review_texts = [review.get('text', '') for review in reviews]
    print("review texts: " + str(review_texts))

    # Step 3: Summarize the reviews using Vertex AI
    reviews_text = '\n'.join(review_texts)
    reviews_summary_response = model.generate_content(
        f"Provide a summary with about two sentences for the following reviews:\n{reviews_text}"
    )
    reviews_summary = reviews_summary_response.text


    reviews_accessiblity_response = model.generate_content(
        f"Provide a simplistic summary in 1 to 3 setences on tips about the accessiblity of the place for a blind user, based the following reviews:\n{reviews_text}"
    )
    reviews_accessiblity = reviews_accessiblity_response.text
    print("RETURNING: " +str(reviews_accessiblity))

    # Step 4: Return both the article summary and reviews summary
    return jsonify({
        "article_summary": article_summary,
        "reviews_summary": reviews_summary,
        "reviews_accessiblity": reviews_accessiblity
    })


    print('heree')
    return jsonify({"error": f"Error fetching reviews: {str(e)}"}), 500

@app.route('/summarize_directions', methods=['POST'])
def summarize_directions():
    print('Received request to summarize directions')

    # Get the directions data from the POST request
    data = request.get_json()
    directions_data = data.get('directions_data', '')

    if not directions_data:
        return jsonify({"error": "No directions data provided"}), 400

    # Step 1: Extract directions from the Google Directions API response
    steps = directions_data.get('routes', [])[0].get('legs', [])[0].get('steps', [])
    directions_text = "\n".join([step.get('html_instructions', '') for step in steps])

    if not directions_text:
        return jsonify({"error": "No directions available in the data"}), 400

    print(f"Directions extracted: {directions_text}")

    # Step 2: Summarize the directions using Vertex AI (or another summarization model)
    summary_response = model.generate_content(
        f"Provide a short summary of the following directions:\n{directions_text}"
    )
    directions_summary = summary_response.text
    print(f"Directions summary: {directions_summary}")

    # Step 3: Return the summarized directions
    return jsonify({
        "directions_summary": directions_summary
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
