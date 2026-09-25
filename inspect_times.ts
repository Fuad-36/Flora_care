const response = await fetch("http://localhost:3000/api/conversations?userId=user_1790318217079");
const data = await response.json();
for (const conversation of data) {
  console.log("CONVERSATION", conversation.id, "time", conversation.time);
  for (const message of conversation.messages || []) {
    console.log("MESSAGE", JSON.stringify({ id: message.id, senderId: message.senderId, time: message.time, createdAt: message.createdAt }));
  }
}
