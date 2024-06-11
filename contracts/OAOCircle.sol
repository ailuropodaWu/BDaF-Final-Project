// SampleContract.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "../OAO/contracts/interfaces/IAIOracle.sol";
import "../OAO/contracts/AIOracle.sol";
import "../OAO/contracts/AIOracleCallbackReceiver.sol";

// this contract is for ai.hyperoracle.io websie
contract OAOCircle is AIOracleCallbackReceiver {

    event promptsUpdated(
        uint256 requestId,
        string input,
        string output,
        bytes callbackData
    );

    event promptRequest(uint256 requestId, address sender, string prompt);

    struct AIOracleRequest {
        address sender;
        bytes input;
        bytes output;
    }

    uint256 _modelID = 11;
    // requestId => AIOracleRequest
    mapping(uint256 => AIOracleRequest) public requests;

    /// @notice Initialize the contract, binding it to a specified AIOracle.
    constructor(IAIOracle _aiOracle) AIOracleCallbackReceiver(_aiOracle) {}

    /// @notice Gas limit set on the callback from AIOracle.
    /// @dev Should be set to the maximum amount of gas your callback might reasonably consume.
    uint64 public constant AIORACLE_CALLBACK_GAS_LIMIT = 5000000;

    // uint256: modelID => (string: prompt => string: output)
    mapping(string => string) public prompts;


    function getAIResult(string calldata prompt) external view returns (string memory) {
        return prompts[prompt];
    }

    // the callback function, only the AI Oracle can call this function
    function aiOracleCallback(
        uint256 requestId,
        bytes calldata output,
        bytes calldata callbackData
    ) external override onlyAIOracleCallback {
        // since we do not set the callbackData in this example, the callbackData should be empty
        AIOracleRequest storage request = requests[requestId];
        request.output = output;
        prompts[string(request.input)] = string(output);
        emit promptsUpdated(
            requestId,
            string(request.input),
            string(output),
            callbackData
        );
    }

    function estimateFee(uint256 modelId) public view returns (uint256) {
        return aiOracle.estimateFee(modelId, AIORACLE_CALLBACK_GAS_LIMIT);
    }

    function calculateAIResult(string calldata prompt) external payable {
        bytes memory input = bytes(prompt);
        // we do not need to set the callbackData in this example
        uint256 requestId = aiOracle.requestCallback{value: msg.value}(
            _modelID,
            input,
            address(this),
            AIORACLE_CALLBACK_GAS_LIMIT,
            ""
        );
        AIOracleRequest storage request = requests[requestId];
        request.input = input;
        request.sender = msg.sender;
        emit promptRequest(requestId, msg.sender, prompt);
    }
}
