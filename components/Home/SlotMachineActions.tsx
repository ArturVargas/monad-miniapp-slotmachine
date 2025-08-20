import { useFrame } from '@/components/farcaster-provider'
import { SLOT_MACHINE_ABI, SLOT_MACHINE_CONTRACT_ADDRESS, USDC_CONTRACT_ADDRESS } from '@/lib/contracts'
import { erc20Abi } from 'viem'
import { parseUnits, formatUnits } from 'viem'
import { monadTestnet } from 'viem/chains'
import {
  useAccount,
  useReadContract,
  useSwitchChain,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi'
import { useState, useEffect } from 'react'

export function SlotMachineActions() {
  const { isEthProviderAvailable } = useFrame()
  const { isConnected, address, chainId } = useAccount()
  const { switchChain } = useSwitchChain()
  const [betAmount, setBetAmount] = useState('1')
  const [isProcessing, setIsProcessing] = useState(false)
  const [status, setStatus] = useState('')

  // Wagmi hooks para escribir contratos
  const { writeContract: writeUSDCContract, isPending: isUSDCWritePending, data: approveHash } = useWriteContract()
  const { writeContract: writeSlotMachineContract, isPending: isSlotMachineWritePending, data: spinHash } = useWriteContract()

  // Hooks para esperar las transacciones
  const { isLoading: isApproveLoading, isSuccess: isApproveSuccess, isError: isApproveError, error: approveError } = useWaitForTransactionReceipt({
    hash: approveHash,
  })

  const { isLoading: isSpinLoading, isSuccess: isSpinSuccess, isError: isSpinError, error: spinError } = useWaitForTransactionReceipt({
    hash: spinHash,
  })

  // Leer el balance de USDC del usuario
  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: USDC_CONTRACT_ADDRESS,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && chainId === monadTestnet.id,
    },
  })

  // Leer los decimales del token USDC
  const { data: decimals } = useReadContract({
    address: USDC_CONTRACT_ADDRESS,
    abi: erc20Abi,
    functionName: 'decimals',
    query: {
      enabled: chainId === monadTestnet.id,
    },
  })

  // Leer la apuesta mínima del slot machine
  const { data: minBet } = useReadContract({
    address: SLOT_MACHINE_CONTRACT_ADDRESS,
    abi: SLOT_MACHINE_ABI,
    functionName: 'minBetUSDC',
    query: {
      enabled: chainId === monadTestnet.id,
    },
  })

  // Leer la apuesta máxima del slot machine
  const { data: maxBet } = useReadContract({
    address: SLOT_MACHINE_CONTRACT_ADDRESS,
    abi: SLOT_MACHINE_ABI,
    functionName: 'maxBetUSDC',
    query: {
      enabled: chainId === monadTestnet.id,
    },
  })

  // Leer el allowance (permiso) que tiene el contrato del slot machine
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: USDC_CONTRACT_ADDRESS,
    abi: erc20Abi,
    functionName: 'allowance',
    args: address ? [address, SLOT_MACHINE_CONTRACT_ADDRESS] : undefined,
    query: {
      enabled: !!address && chainId === monadTestnet.id,
    },
  })

  // Efectos para manejar los estados de las transacciones
  useEffect(() => {
    if (isApproveSuccess) {
      setStatus('¡Approve completado exitosamente!')
      setIsProcessing(false)
      refetchAllowance()
    }
  }, [isApproveSuccess, refetchAllowance])

  useEffect(() => {
    if (isApproveError) {
      setStatus('Error en approve: ' + approveError?.message)
      setIsProcessing(false)
    }
  }, [isApproveError, approveError])

  useEffect(() => {
    if (isSpinSuccess) {
      setStatus('¡Spin completado exitosamente!')
      setIsProcessing(false)
      refetchBalance()
      refetchAllowance()
    }
  }, [isSpinSuccess, refetchBalance, refetchAllowance])

  useEffect(() => {
    if (isSpinError) {
      setStatus('Error en spin: ' + spinError?.message)
      setIsProcessing(false)
    }
  }, [isSpinError, spinError])



  // Función para ejecutar approve separadamente
  async function approveUSDCHandler() {
    if (!address) return

    try {
      setIsProcessing(true)
      setStatus('')
      
      // Cantidad de USDC para el spin
      const spinAmount = parseUnits(betAmount, decimals || 6)
      
      console.log('Enviando transacción de approve...')
      setStatus('Enviando approve...')
      
      writeUSDCContract({
        address: USDC_CONTRACT_ADDRESS,
        abi: erc20Abi,
        functionName: 'approve',
        args: [SLOT_MACHINE_CONTRACT_ADDRESS, spinAmount],
      })
      
    } catch (error) {
      console.error('Error ejecutando approve:', error)
      setStatus('Error en approve: ' + (error as Error).message)
      setIsProcessing(false)
    }
  }

  // Función para ejecutar spin separadamente
  async function spinWithUSDCHandler() {
    if (!address) return

    try {
      setIsProcessing(true)
      setStatus('')
      
      // Cantidad de USDC para el spin
      const spinAmount = parseUnits(betAmount, decimals || 6)

      // Verificar si tiene allowance suficiente
      const hasAllowance = allowance && allowance >= spinAmount
      
      if (!hasAllowance) {
        setStatus('Error: No tienes allowance suficiente. Ejecuta approve primero.')
        setIsProcessing(false)
        return
      }
      
      console.log('Enviando transacción de spin...')
      setStatus('Enviando spin...')
      
      writeSlotMachineContract({
        address: SLOT_MACHINE_CONTRACT_ADDRESS,
        abi: SLOT_MACHINE_ABI,
        functionName: 'spinWithUSDC',
        args: [spinAmount],
      })
      
    } catch (error) {
      console.error('Error ejecutando spin:', error)
      setStatus('Error en spin: ' + (error as Error).message)
      setIsProcessing(false)
    }
  }

  if (!isConnected) {
    return (
      <div className="space-y-4 border border-[#333] rounded-md p-4">
        <h2 className="text-xl font-bold text-left">Slot Machine con USDC</h2>
        <div className="flex flex-row space-x-4 justify-start items-start">
          <p className="text-sm text-left">Conecta tu wallet para usar el slot machine</p>
        </div>
      </div>
    )
  }

  if (chainId !== monadTestnet.id) {
    return (
      <div className="space-y-4 border border-[#333] rounded-md p-4">
        <h2 className="text-xl font-bold text-left">Slot Machine con USDC</h2>
        <div className="flex flex-row space-x-4 justify-start items-start">
          <button
            type="button"
            className="bg-white text-black rounded-md p-2 text-sm"
            onClick={() => switchChain({ chainId: monadTestnet.id })}
          >
            Cambiar a Monad Testnet
          </button>
        </div>
      </div>
    )
  }

  const formattedBalance = balance && decimals 
    ? formatUnits(balance, decimals)
    : '0'

  const formattedMinBet = minBet && decimals 
    ? formatUnits(minBet, decimals)
    : '0'

  const formattedMaxBet = maxBet && decimals 
    ? formatUnits(maxBet, decimals)
    : '0'

  const formattedAllowance = allowance && decimals 
    ? formatUnits(allowance, decimals)
    : '0'

  const currentBetAmount = parseFloat(betAmount)
  const userBalance = parseFloat(formattedBalance)
  const minBetAmount = parseFloat(formattedMinBet)
  const maxBetAmount = parseFloat(formattedMaxBet)
  const currentAllowance = parseFloat(formattedAllowance)

  const isValidBet = currentBetAmount >= minBetAmount && 
                    currentBetAmount <= maxBetAmount && 
                    currentBetAmount <= userBalance

  return (
    <div className="space-y-4 border border-[#333] rounded-md p-4">
      <h2 className="text-xl font-bold text-left">Slot Machine con USDC</h2>
      <div className="flex flex-col space-y-4 justify-start">
        <div className="flex flex-col space-y-2">
          <p className="text-sm text-left">
            Balance USDC:{' '}
            <span className="bg-white font-mono text-black rounded-md p-[4px]">
              {formattedBalance} USDC
            </span>
          </p>
          <p className="text-sm text-left">
            Allowance:{' '}
            <span className="bg-white font-mono text-black rounded-md p-[4px]">
              {formattedAllowance} USDC
            </span>
          </p>
          <p className="text-sm text-left">
            Apuesta mínima:{' '}
            <span className="bg-white font-mono text-black rounded-md p-[4px]">
              {formattedMinBet} USDC
            </span>
          </p>
          <p className="text-sm text-left">
            Apuesta máxima:{' '}
            <span className="bg-white font-mono text-black rounded-md p-[4px]">
              {formattedMaxBet} USDC
            </span>
          </p>
          <button
            type="button"
            className="bg-white text-black rounded-md p-2 text-sm"
            onClick={() => {
              refetchBalance()
              refetchAllowance()
            }}
          >
            Actualizar Datos
          </button>
        </div>

        <div className="flex flex-col space-y-2 border border-[#333] p-4 rounded-md">
          <h3 className="text-lg font-semibold text-left">Spin con USDC</h3>
          <div className="flex flex-col space-y-2">
            <input
              type="number"
              placeholder="Cantidad USDC para apostar"
              className="bg-white text-black rounded-md p-2 text-sm"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              step="0.000001"
              min={formattedMinBet}
              max={formattedMaxBet}
            />
            
            {/* Botón de Approve */}
            <button
              type="button"
              className="bg-blue-500 text-white rounded-md p-2 text-sm disabled:opacity-50"
              onClick={approveUSDCHandler}
              disabled={isUSDCWritePending || isApproveLoading || !isValidBet}
            >
              {isUSDCWritePending || isApproveLoading ? 'Procesando...' : `Approve ${betAmount} USDC`}
            </button>
            
            {/* Botón de Spin */}
            <button
              type="button"
              className="bg-green-500 text-white rounded-md p-2 text-sm disabled:opacity-50"
              onClick={spinWithUSDCHandler}
              disabled={isSlotMachineWritePending || isSpinLoading || !isValidBet}
            >
              {isSlotMachineWritePending || isSpinLoading ? 'Procesando...' : `Spin con ${betAmount} USDC`}
            </button>
            
            {/* Estado de las transacciones */}
            {(isUSDCWritePending || isApproveLoading || isSlotMachineWritePending || isSpinLoading) && (
              <div className="text-blue-400 text-sm">
                {isUSDCWritePending && 'Enviando approve...'}
                {isApproveLoading && 'Confirmando approve...'}
                {isSlotMachineWritePending && 'Enviando spin...'}
                {isSpinLoading && 'Confirmando spin...'}
              </div>
            )}
            
            {/* Estado de éxito/error */}
            {status && !isUSDCWritePending && !isApproveLoading && !isSlotMachineWritePending && !isSpinLoading && (
              <div className={`text-sm ${status.includes('Error') ? 'text-red-400' : 'text-green-400'}`}>
                {status}
              </div>
            )}
            
            {/* Hashes de transacciones */}
            {approveHash && (
              <div className="text-xs text-gray-400">
                Approve Hash: {approveHash.slice(0, 6)}...{approveHash.slice(-4)}
              </div>
            )}
            {spinHash && (
              <div className="text-xs text-gray-400">
                Spin Hash: {spinHash.slice(0, 6)}...{spinHash.slice(-4)}
              </div>
            )}
            
            {/* Validaciones */}
            {!isValidBet && (
              <p className="text-red-400 text-sm">
                {currentBetAmount < minBetAmount && `Apuesta mínima: ${formattedMinBet} USDC`}
                {currentBetAmount > maxBetAmount && `Apuesta máxima: ${formattedMaxBet} USDC`}
                {currentBetAmount > userBalance && 'Saldo insuficiente'}
              </p>
            )}
            
            {/* Información sobre allowance */}
            {allowance && allowance < parseUnits(betAmount, decimals || 6) && (
              <p className="text-yellow-400 text-sm">
                Necesitas hacer approve primero
              </p>
            )}
          </div>
        </div>

        <div className="text-xs text-gray-400">
          <p>• <strong>Paso 1:</strong> Haz clic en "Approve" para autorizar el gasto</p>
          <p>• <strong>Paso 2:</strong> Haz clic en "Spin" para ejecutar el juego</p>
          <p>• Usa wagmi hooks para las transacciones</p>
          <p>• Requiere conexión a Monad Testnet</p>
        </div>
      </div>
    </div>
  )
}
