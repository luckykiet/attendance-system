const NodeEnvironment = require("jest-environment-node").default;

class NodeEnvironmentFailFast extends NodeEnvironment {
    failedDescribeMap = {};
    registeredEventHandler = [];

    async setup() {
        await super.setup();
        this.global.testEnvironment = this;
    }

    registerTestEventHandler(registeredEventHandler) {
        this.registeredEventHandler.push(registeredEventHandler);
    }

    async executeTestEventHandlers(event, state) {
        for (let handler of this.registeredEventHandler) {
            await handler(event, state);
        }
    }

    async handleTestEvent(event, state) {
        await this.executeTestEventHandlers(event, state);

        switch (event.name) {
            case "hook_failure": {
                const describeBlockName = event.hook.parent.name;
                this.failedDescribeMap[describeBlockName] = true;
                console.error(`ERROR: ${describeBlockName} > ${event.hook.type}\n\n`, event.error, "\n");
                break;
            }
            case "test_fn_failure": {
                this.failedDescribeMap[event.test.parent.name] = true;
                break;
            }
            case "test_start": {
                if (this.failedDescribeMap[event.test.parent.name]) {
                    event.test.mode = "skip";
                }
                break;
            }
        }

        if (super.handleTestEvent) {
            await super.handleTestEvent(event, state);
        }
    }
}

module.exports = NodeEnvironmentFailFast;
