import { StyleSheet, Text, View, Button, TextInput } from "react-native";
import { useState } from "react";
import { startActivityAsync, ActivityAction } from "expo-intent-launcher";
import CurrencyInput, { formatNumber } from "react-native-currency-input";
import SelectDropdown from "react-native-select-dropdown";
import uuid from "react-native-uuid";

export default function App() {
  const [isStarted, setIsStarted] = useState(false);
  const [intentResult, setIntentResult] = useState(null);
  const [intentCancelled, setIntentCancelled] = useState(false);
  const [intentCompleted, setIntentCompleted] = useState(false);
  // params
  const [originator, setOriginator] = useState("Custom App");
  const [reference, setReference] = useState("");
  const [amount, setAmount] = useState(0);

  const originators = [
    "Custom App",
    "Cab9",
    "Autocab",
    "iCabbi",
    "CabTreasure",
    "Cordic",
  ];

  const presets = [
    {
      label: "Custom",
      originator: "Custom App",
      amount: 0,
      reference: "",
    },
    {
      label: "Invalid payload",
      reference:
        "Because this reference exceeds the allowed length of 100 characters, it will not be accepted as valid.",
    },
  ];

  const PACKAGE_NAME = "services.cabcard.driver";

  async function handleStart() {
    setIsStarted(true);

    const params = {
      amount: Math.round(amount * 100), // must be an integer (currency minor units)
      currency: "GBP", // static value
      originator,
      reference,
      identifier: uuid.v4(), // a unique identifier
    };

    // open via Intent
    const intentParams = {
      packageName: PACKAGE_NAME,
      className: `${PACKAGE_NAME}.MainActivity`,
      extra: {
        action: "transaction", // fixed value
        transaction: JSON.stringify(params), // dynamic parameters
      },
    };

    try {
      const intentResult = await startActivityAsync(
        "ACTION_MAIN",
        intentParams
      );

      console.log("intent result: ", intentResult);

      setIntentResult(intentResult);
      if (intentResult.resultCode === 0) {
        setIntentCancelled(true);
      }
      if (intentResult.resultCode === -1) {
        setIntentCompleted(true);
      }
    } catch (error) {
      console.error("Intent error (message): ", error.message);
      console.error("Intent error (err): ", error);
    }
  }

  function handleReset() {
    setIsStarted(false);
    setIntentResult(null);
    setIntentCancelled(false);
    setIntentCompleted(false);
    setReference("");
    setAmount(0);
  }

  return (
    <View style={styles.container}>
      {!isStarted && (
        <>
          {/* Presets */}
          <Text>Presets</Text>
          <SelectDropdown
            data={presets}
            onSelect={(sel, index) => {
              // setOriginator(selectedItem);
              if (sel.amount) {
                setAmount(sel.amount);
              }
              if (sel.originator) {
                setOriginator(sel.originator);
              }
              if (sel.reference) {
                setReference(sel.reference);
              }
            }}
            buttonTextAfterSelection={(selectedItem, index) =>
              selectedItem.label
            }
            rowTextForSelection={(item, index) => item.label}
          />

          <View style={styles.form}>
            {/* App name */}
            <Text>Your App Name</Text>
            <SelectDropdown
              data={originators}
              onSelect={(selectedItem, index) => {
                setOriginator(selectedItem);
              }}
              buttonTextAfterSelection={(selectedItem, index) => selectedItem}
              rowTextForSelection={(item, index) => item}
            />
            {/* Transcation reference (e.g. a booking ID) */}
            <Text>Transaction reference:</Text>
            <TextInput
              style={styles.input}
              onChangeText={setReference}
              value={reference}
            />

            {/* Transaction amount */}
            <CurrencyInput
              style={{
                height: 70,
                fontSize: 48,
              }}
              autoFocus={true}
              value={amount}
              onChangeValue={setAmount}
              prefix="£"
              delimiter=","
              separator="."
              precision={2}
              minValue={0}
              // editable={!isWorking}
            />

            <Button
              onPress={handleStart}
              title="Open CabCard"
              color="red"
              disabled={amount < 1}
            />
          </View>
        </>
      )}

      {isStarted && (
        <>
          {intentCancelled && <Text>Action was CANCELLED</Text>}
          {intentCompleted && <Text>Action was COMPLETED</Text>}
          <Text>Intent result:</Text>
          {/* Success outcome: */}
          {intentResult &&
            intentResult.extra &&
            intentResult.extra.transactionAttempt && (
              <Text>
                Response:{" "}
                {JSON.stringify(intentResult.extra.transactionAttempt, null, 2)}
              </Text>
            )}

          {/* Error outcome: */}
          {intentResult && intentResult.extra && intentResult.extra.error && (
            <Text>Error: {intentResult.extra.message}</Text>
          )}

          <Button onPress={handleReset} title="Reset" color="blue" />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "lightblue",
    alignItems: "center",
    justifyContent: "center",
  },

  input: {
    backgroundColor: "white",
    height: 40,
    margin: 12,
    width: 200,
    borderWidth: 1,
    padding: 10,
  },

  form: {
    marginTop: 16,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
  },
});
