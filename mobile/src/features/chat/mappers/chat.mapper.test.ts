import test from "node:test";
import assert from "node:assert/strict";
import { chatMapper } from "./chat.mapper";

test("delete chat session response maps the owned session id", () => {
  assert.deepEqual(
    chatMapper.toDeletedSession({
      success: true,
      data: { id: "session-1" },
      meta: null,
    }),
    { id: "session-1" },
  );
});
