import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

# ── Load system prompt ──────────────────────────────────────────
with open("nayepankh_system_prompt.txt", "r", encoding="utf-8") as f:
    SYSTEM_PROMPT = f.read()

# ── Groq client ─────────────────────────────────────────────────
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# ── Memory — this IS the agent's memory ─────────────────────────
conversation_history = [
    {"role": "system", "content": SYSTEM_PROMPT}
]

# ── Agent function ───────────────────────────────────────────────
def chat(user_message: str) -> str:
    # Add user message to memory
    conversation_history.append({
        "role": "user",
        "content": user_message
    })

    # Call Groq API with full conversation history
    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=conversation_history,
        temperature=0.7,
        max_tokens=1024,
    )

    # Extract reply
    reply = response.choices[0].message.content

    # Save reply to memory
    conversation_history.append({
        "role": "assistant",
        "content": reply
    })

    return reply

# ── Main loop ────────────────────────────────────────────────────
if __name__ == "__main__":
    print("=" * 50)
    print("  Asha — NayePankh Foundation AI Assistant")
    print("  Type 'quit' to exit")
    print("=" * 50)

    # Greet the user
    greeting = chat("Hello!")
    print(f"\nAsha: {greeting}\n")

    while True:
        user_input = input("You: ").strip()

        if not user_input:
            continue

        if user_input.lower() in ["quit", "exit", "bye"]:
            print("\nAsha: Thank you for talking to me! 💙 NayePankh Foundation is always here to help.")
            break

        response = chat(user_input)
        print(f"\nAsha: {response}\n")