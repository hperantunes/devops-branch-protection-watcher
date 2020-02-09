import {expect, assert} from "chai";
import * as chai from "chai";
import * as sinon from "sinon";
import * as sinonChai from "sinon-chai";

chai.use(sinonChai);

describe("index", () => {
    it("should have a test placeholder", () => {
        assert.isOk("placeholder");
    });
});