import {
  fireEvent,
  getByText,
  render,
  waitForElementToBeRemoved,
  wait,
  findByRole
} from "@testing-library/react";
import React from "react";
const { axe, toHaveNoViolations } = require("jest-axe");

expect.extend(toHaveNoViolations);

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

describe("DOM Mutation Snapshots", () => {
  test("Observe the DOM with axe", async () => {
    function MyForm() {
      const [bad, setBad] = React.useState(false);
      return (
        <>
          <form>
            {bad ? null : <label htmlFor="username">Username</label>}
            <input id="username" placeholder="username" />
          </form>
          <button onClick={() => setBad(true)}>
            {bad ? "Make it Good" : "Make it Bad"}
          </button>
        </>
      );
    }
    const changes = [];
    const observer = new MutationObserver(mutations => {
      // I believe the async nature of MutationObserver means
      // we could technically miss a render here if there were
      // two renders back to back that were reported to the observer
      // at one time.
      const dom = document.body.innerHTML;
      changes.push(dom);
    });

    observer.observe(document.body, {
      attributes: true,
      childList: true,
      characterData: true,
      subtree: true
    });

    const { container } = render(<MyForm />);

    fireEvent.click(await findByRole(container, "button"));

    // Without this sleep the observer seems to disconnect too soon
    // and misses the rerender that switches us into the "bad" state.
    // Maybe if this code were inside of dom-testing-library it could
    // have a better indicator of doneness?
    await wait(async () => {
      await sleep(0);
      return expect(true);
    });

    observer.disconnect();

    for (const dom of changes) {
      console.log({ dom });
      expect(await axe(dom)).toHaveNoViolations();
    }
  });
});
